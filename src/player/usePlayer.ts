import { useState, useMemo } from "react";
import {
  isLocationInBounds,
  compareLocations,
  getDimensions,
  getNeighbors,
  getCrossDirections,
} from "functional-game-utils";
import { v4 as uuidv4 } from "uuid";
import useKeyPress from "../input/useKeyPress";
import { Location } from "../grid/Grid";
import addLocations from "../grid/addLocations";
import remove from "../arrays/remove";
import { createEntity, Entity } from "../entities/useEntities";
import tracker from "../audio/tracker";
import getAllMatchingLocations from "../grid/getAllMatchingLocations";
import pickRandomlyFromArray from "../arrays/pickRandomlyFromArray";
import clamp from "../numbers/clamp";

type Item = {
  id: string;
  icon: string;
};

const initialItems = [];
const initialHealth = 3;
const initialLocation = { row: 1, col: 1 };

const usePlayer = ({
  tiles,
  entities,
  setTextForEntity,
  clearAllEntityText,
  deleteEntity,
  replaceEntity,
  addEntity,
}: {
  tiles: string[][];
  entities: Entity[];
  setTextForEntity: (entity: Entity, text: string) => void;
  clearAllEntityText: () => void;
  deleteEntity: (entity: Entity) => void;
  replaceEntity: (oldEntity: Entity, newEntity: Entity) => void;
  addEntity: (icon: string, location: Location) => void;
}) => {
  const { width, height } = useMemo(() => getDimensions(tiles), [tiles]);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [health, setHealth] = useState(initialHealth);
  const [playerLocation, setPlayerLocation] = useState(initialLocation);

  const isLocationEmpty = (location: Location) => {
    return (
      !entities.some((entity) => compareLocations(entity.location, location)) &&
      !compareLocations(location, playerLocation)
    );
  };

  const getEmptyLocations = () =>
    getAllMatchingLocations(tiles, (_, location) => {
      return isLocationEmpty(location);
    });

  const tryMoveDirection = (direction: Location) => {
    // You can no longer move if you are dead
    if (health <= 0) return;

    const newLocation = addLocations(playerLocation, direction);

    const doesPlayerHaveHelicopter = items.some((item) => item.icon === "🚁");

    /**
     * If player has helicopter, then enable screen wrapping.
     */
    if (doesPlayerHaveHelicopter) {
      if (newLocation.row < 0) {
        newLocation.row = height - 1;
      }
      if (newLocation.col < 0) {
        newLocation.col = width - 1;
      }
      if (newLocation.row > height - 1) {
        newLocation.row = 0;
      }
      if (newLocation.col > width - 1) {
        newLocation.col = 0;
      }
    }

    if (!isLocationInBounds(tiles, newLocation)) {
      return;
    }

    // Take a snapshot of entities at this time
    [...entities].forEach((entity) => {
      switch (entity.timerBehavior.type) {
        case "grow":
          const newElapsedTime = entity.timerBehavior.elapsedTime + 1;
          if (newElapsedTime >= entity.timerBehavior.targetTime) {
            addEntity(entity.timerBehavior.newEntity, entity.location);
            deleteEntity(entity);
          } else {
            replaceEntity(entity, {
              ...entity,
              timerBehavior: {
                ...entity.timerBehavior,
                elapsedTime: newElapsedTime,
              },
            });
          }
          break;
        case "flammable":
          const neighborLocations = getNeighbors(
            getCrossDirections,
            tiles,
            entity.location
          );
          const neighbors: (Entity | undefined)[] = neighborLocations.map(
            (neighborLocation) =>
              entities.find((otherEntity) =>
                compareLocations(neighborLocation, otherEntity.location)
              )
          );
          neighbors.forEach((neighbor) => {
            if (!neighbor) return;
            // If flammable replace with fire
            if (neighbor.icon === "🌲" || neighbor.icon === "🌳") {
              addEntity("🔥", neighbor.location);
              deleteEntity(neighbor);
            }
          });
          break;
        case "none":
        default:
          break;
      }
    });

    const entityAtLocation = entities.find((entity) =>
      compareLocations(entity.location, newLocation)
    );

    if (entityAtLocation) {
      switch (entityAtLocation.behavior.type) {
        case "talk":
          setTextForEntity(entityAtLocation, entityAtLocation.behavior.text);
          break;
        case "fight":
          const playerDamage = countIconsInInventory("🗡️", items);
          const newHealth = entityAtLocation.behavior.health - playerDamage;

          let newEntity: Entity = {
            ...entityAtLocation,
            behavior: {
              ...entityAtLocation.behavior,
              health: newHealth,
            },
            text: `${new Array(entityAtLocation.behavior.damage)
              .fill("🗡️")
              .join("")} - ${new Array(clamp(newHealth, 0, 100))
              .fill("❤️")
              .join("")}`,
          };

          const isEntityAtLocationDead = newHealth <= 0;

          if (isEntityAtLocationDead) {
            newEntity = createEntity(
              entityAtLocation.behavior.drop,
              newLocation
            );
          }

          replaceEntity(entityAtLocation, newEntity);
          if (!isEntityAtLocationDead) {
            setHealth(health - entityAtLocation.behavior.damage);
          }
          break;
        case "chop":
          if (items.find((item) => item.icon === "🪓")) {
            const logEntity = createEntity("🪵", newLocation);
            replaceEntity(entityAtLocation, logEntity);
          }
          break;
        case "item":
          const newItems = [
            ...items,
            { id: uuidv4(), icon: entityAtLocation.icon },
          ];
          setItems(newItems);
          deleteEntity(entityAtLocation);
          setPlayerLocation(newLocation);
          break;
        case "trade":
          if (entityAtLocation.behavior.hasTraded) {
            setTextForEntity(
              entityAtLocation,
              entityAtLocation.behavior.satisfiedText
            );
          } else if (
            doesInventoryHaveAllItemsByIcon(
              entityAtLocation.behavior.input,
              items
            )
          ) {
            setItems([
              ...removeAllByIcon(entityAtLocation.behavior.input, items),
              ...entityAtLocation.behavior.output.map((icon) => ({
                id: uuidv4(),
                icon,
              })),
            ]);
            replaceEntity(entityAtLocation, {
              ...entityAtLocation,
              text: entityAtLocation.behavior.satisfiedText,
              behavior: {
                ...entityAtLocation.behavior,
                // If a trade is reusable, then we never mark it
                // as hasTraded is true.
                hasTraded: !entityAtLocation.behavior.reusable,
              },
            });
          } else {
            setTextForEntity(
              entityAtLocation,
              entityAtLocation.behavior.requestText
            );
          }
          break;
        case "ship":
          if (doesInventoryHaveAllItemsByIcon(["🛠️", "⚙️", "🔩"], items)) {
            replaceEntity(entityAtLocation, {
              ...entityAtLocation,
              text: "SHHWIP - Your ship's systems come back to life",
              behavior: {
                ...entityAtLocation.behavior,
                isRepaired: true,
              },
            });
            setItems(removeAllByIcon(["⚙️", "🔩"], items));
          } else {
            setTextForEntity(
              entityAtLocation,
              "Your ship is damaged! It needs 3 parts to be repaired."
            );
          }
          break;
        case "audio":
          const { track: trackName } = entityAtLocation.behavior;

          if (!tracker.isLoaded) {
            console.error(`Tried to play a track, but tracker isn't loaded.`);
            return;
          }

          const track = tracker.tracks[trackName];

          if (!track) {
            console.error(
              `Tried to play/stop track "${trackName}", but it doesn't exist.`
            );
            return;
          }

          if (track.isPlaying) {
            track.stop();
          } else {
            track.play();
          }
          break;
        case "planter":
          if (
            doesInventoryHaveAllItemsByIcon(
              entityAtLocation.behavior.input,
              items
            )
          ) {
            const emptyLocations = getEmptyLocations();
            const targetLocation = pickRandomlyFromArray(emptyLocations);
            // TODO:
            // Support multiple output locations
            addEntity(entityAtLocation.behavior.output[0], targetLocation);
            setItems(removeAllByIcon(entityAtLocation.behavior.input, items));
          } else {
            setTextForEntity(
              entityAtLocation,
              entityAtLocation.behavior.requestText
            );
          }
          break;
        case "bird":
          const emptyLocations = getEmptyLocations();
          const targetLocation = pickRandomlyFromArray(emptyLocations);
          replaceEntity(entityAtLocation, {
            ...entityAtLocation,
            location: targetLocation,
          });
          addEntity("🌰", entityAtLocation.location);
          break;
        case "toll":
          const locationPastTollEntity = addLocations(
            entityAtLocation.location,
            direction
          );

          if (!isLocationEmpty(locationPastTollEntity)) {
            // Cannot charge toll, if exit is blocked
            setTextForEntity(
              entityAtLocation,
              entityAtLocation.behavior.blockedText
            );
            return;
          }

          if (
            doesInventoryHaveAllItemsByIcon(
              entityAtLocation.behavior.input,
              items
            )
          ) {
            setItems(removeAllByIcon(entityAtLocation.behavior.input, items));
            setPlayerLocation(locationPastTollEntity);
            setTextForEntity(
              entityAtLocation,
              entityAtLocation.behavior.satisfiedText
            );
          } else {
            setTextForEntity(
              entityAtLocation,
              entityAtLocation.behavior.requestText
            );
          }

          break;
        case "trample":
          setPlayerLocation(entityAtLocation.location);
          deleteEntity(entityAtLocation);
          break;
        case "hurt":
          setHealth(health - entityAtLocation.behavior.damage);
          break;
        case "eat":
          setPlayerLocation(entityAtLocation.location);
          setHealth(health + entityAtLocation.behavior.heal);
          deleteEntity(entityAtLocation);
          break;
        default:
          console.warn(
            `Behavior not implemented: ${entityAtLocation.behavior.type}`
          );
          break;
      }
      return;
    }

    clearAllEntityText();

    setPlayerLocation(newLocation);
  };

  useKeyPress({
    KeyW: () => tryMoveDirection({ row: -1, col: 0 }),
    KeyA: () => tryMoveDirection({ row: 0, col: -1 }),
    KeyS: () => tryMoveDirection({ row: 1, col: 0 }),
    KeyD: () => tryMoveDirection({ row: 0, col: 1 }),
    ArrowUp: () => tryMoveDirection({ row: -1, col: 0 }),
    ArrowLeft: () => tryMoveDirection({ row: 0, col: -1 }),
    ArrowDown: () => tryMoveDirection({ row: 1, col: 0 }),
    ArrowRight: () => tryMoveDirection({ row: 0, col: 1 }),
  });

  const reset = () => {
    setItems([...initialItems]);
    setHealth(initialHealth);
    setPlayerLocation({ ...initialLocation });
  };

  return { playerLocation, health, items, reset };
};

function doesInventoryHaveAllItemsByIcon(
  itemIcons: string[],
  inventory: Item[]
) {
  let inventoryCopy = [...inventory];

  for (let itemIcon of itemIcons) {
    const itemIndexInInventory = inventoryCopy.findIndex(
      (inventoryItem) => inventoryItem.icon === itemIcon
    );

    // If we can't find the item in the inventory, then
    // this match has failed.
    if (itemIndexInInventory === -1) {
      return false;
    }

    inventoryCopy = remove(inventoryCopy, itemIndexInInventory);
  }

  return true;
}

function removeAllByIcon(itemIcons: string[], inventory: Item[]) {
  let inventoryCopy = [...inventory];

  for (let itemIcon of itemIcons) {
    const itemIndexInInventory = inventoryCopy.findIndex(
      (inventoryItem) => inventoryItem.icon === itemIcon
    );

    inventoryCopy = remove(inventoryCopy, itemIndexInInventory);
  }

  return inventoryCopy;
}

function countIconsInInventory(icon, inventory) {
  return inventory.reduce((total, item) => {
    if (item.icon === icon) {
      return total + 1;
    }
    return total;
  }, 0);
}

export default usePlayer;

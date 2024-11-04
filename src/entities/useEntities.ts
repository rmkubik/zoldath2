import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Location } from "../grid/Grid";
import forEachMatrix from "../grid/forEachMatrix";
import update from "../arrays/update";
import remove from "../arrays/remove";

export type EntityBehavior =
  // damage entity does to you, health the amount of hits it takes, drop item you get from killing
  | { type: "fight"; damage: number; health: number; drop: string }
  // text is what they say to you
  | { type: "talk"; text: string }
  // heal is how much health you get for eating the entity
  | { type: "eat"; heal: number }
  | { type: "chop" }
  | { type: "mine" }
  | { type: "item" }
  | { type: "none" }
  | { type: "audio"; track: string }
  | { type: "ship"; isRepaired: boolean }
  | { type: "trample" }
  | { type: "hurt"; damage: number }
  | {
      type: "toll";
      input: string[];
      blockedText: string;
      requestText: string;
      satisfiedText: string;
    }
  | { type: "replace"; newEntity: string }
  // What items does the planter take from you, what item does it plant randomly on the screen (only 1 supported rn)
  | { type: "planter"; input: string[]; output: string[]; requestText: string }
  // What item does the bird leave behind when you run into it
  | { type: "bird"; output: string }
  // requestText is what they ask for, satisfiedText is what they say after, input is a lit of items they take from you, output is what they give you
  | {
      type: "trade";
      requestText: string;
      satisfiedText: string;
      input: string[];
      output: string[];
      hasTraded: boolean;
      reusable: boolean;
    };

export type EntityTimerBehavior =
  | { type: "none" }
  | { type: "flammable" }
  | {
      type: "grow";
      elapsedTime: number;
      targetTime: number;
      newEntity: string;
    };

export type Entity = {
  id: string;
  icon: string;
  location: Location;
  behavior: EntityBehavior;
  timerBehavior: EntityTimerBehavior;
  text: string;
};

const behaviorMap: Record<string, EntityBehavior> = {
  "🌳": { type: "chop" },
  "🌲": { type: "chop" },
  "🌱": { type: "trample" },
  "👽": {
    type: "trade",
    input: [],
    output: ["💰"],
    satisfiedText: "Welcome to Zoldath!!",
    requestText: "Welcome to Zoldath!!",
    hasTraded: false,
    reusable: false,
  },
  "🍄": { type: "none" },
  "🤖": {
    type: "trade",
    input: ["🔋"],
    output: ["🛠️"],
    satisfiedText: "BRRP. Robotic Assistant Online. Dispensing repair tools.",
    requestText: "-- power saver mode engaged --",
    hasTraded: false,
    reusable: false,
  },
  "🧑‍🚒": {
    type: "trade",
    requestText: "💰💰💰 and you can have my 🪓.",
    satisfiedText: "Treat her well!",
    input: ["💰", "💰", "💰"],
    output: ["🪓"],
    hasTraded: false,
    reusable: false,
  },
  // "🦖": { type: "fight" },
  "🪓": { type: "item" },
  "🪵": { type: "item" },
  "⚙️": { type: "item" },
  "🛠️": { type: "item" },
  "🔩": { type: "item" },
  "💰": { type: "item" },
  "🐝": { type: "fight", damage: 1, health: 1, drop: "🍯" },
  "🍯": { type: "item" },
  "👹": { type: "fight", damage: 1, health: 3, drop: "💰" },
  "🗡️": { type: "item" },
  "🐻": {
    type: "toll",
    requestText: "Grrrrrrrr!!!",
    satisfiedText: "Zzz...",
    blockedText: "Grrr",
    input: ["🍯"],
  },
  "🪨": { type: "mine" },
  "⛏️": { type: "item" },
  "🔋": { type: "item" },
  "🪫": { type: "item" },
  // "📦": { type: "replace", newEntity:  },
  "🛸": { type: "ship", isRepaired: false },
  "🚁": { type: "item" },
  "📻": { type: "audio", track: "zoldath2" },
  "🥁": { type: "audio", track: "metronome1" },
  "🎺": { type: "audio", track: "metronome2" },
  "🦫": {
    type: "trade",
    requestText: "I'm tired, I'll buy 🪵🪵🪵 at a time.",
    satisfiedText: "Yum - mmmmm - yummy!",
    input: ["🪵", "🪵", "🪵"],
    output: ["💰"],
    hasTraded: false,
    reusable: true,
  },
  "🌰": { type: "item" },
  "🐿️": {
    type: "planter",
    input: ["🌰"],
    output: ["🌱"],
    requestText: "🌰?",
  },
  "🦜": { type: "bird", output: "🌰" },
  "🤺": { type: "fight", damage: 1, health: 2, drop: "🗡️" },
  "🍰": { type: "eat", heal: 1 },
  "🎂": { type: "eat", heal: 3 },
  "🧌": {
    type: "toll",
    requestText: "Come back with 💰",
    satisfiedText: "Thank you for your payment - 💰",
    blockedText: "There's no path here",
    input: ["💰"],
  },
  "🐉": { type: "fight", damage: 2, health: 5, drop: "🔩" },
  "🎛️": {
    type: "trade",
    requestText: "Please insert 💰💰 to charge",
    satisfiedText: "BRRRRRZT - ding!",
    input: ["🪫", "💰", "💰"],
    output: ["🔋"],
    hasTraded: false,
    reusable: false,
  },
  "🌋": { type: "hurt", damage: 1 },
  "🔥": { type: "hurt", damage: 1 },
};

const timerBehaviorMap: Record<string, EntityTimerBehavior> = {
  "🌱": { type: "grow", targetTime: 5, elapsedTime: 0, newEntity: "🌳" },
  "🌋": { type: "flammable" },
  "🔥": { type: "flammable" },
};

export const createEntity = (icon: string, location: Location): Entity => {
  return {
    id: uuidv4(),
    icon,
    behavior: behaviorMap[icon] ?? { type: "none" },
    timerBehavior: timerBehaviorMap[icon] ?? { type: "none" },
    location,
    text: "",
  };
};

const useEntities = ({ tiles }) => {
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    const newEntities: Entity[] = [];

    forEachMatrix((icon, location) => {
      if (icon === ".") {
        return;
      }

      // TODO:
      // Randomize behaviors here?

      const entity = createEntity(icon, location);

      newEntities.push(entity);
    }, tiles);

    setEntities(newEntities);
  }, [tiles]);

  const setTextForEntity = (targetEntity, text) => {
    setEntities((prevEntities) => {
      const entityIndex = prevEntities.findIndex((entity) => {
        return targetEntity.id === entity.id;
      });

      const newEntities = update(prevEntities, entityIndex, {
        ...prevEntities[entityIndex],
        text,
      });
      return newEntities;
    });
  };

  const clearAllEntityText = () => {
    setEntities((prevEntities) =>
      prevEntities.map((entity) => ({
        ...entity,
        text: "",
      }))
    );
  };

  const deleteEntity = (targetEntity) => {
    setEntities((prevEntities) => {
      const entityIndex = prevEntities.findIndex((entity) => {
        return targetEntity.id === entity.id;
      });
      const newEntities = remove(prevEntities, entityIndex);

      return newEntities;
    });
  };

  const replaceEntity = (targetEntity, newEntity) => {
    setEntities((prevEntities) => {
      const entityIndex = prevEntities.findIndex((entity) => {
        return targetEntity.id === entity.id;
      });

      const newEntities = update(prevEntities, entityIndex, newEntity);

      return newEntities;
    });
  };

  const addEntity = (icon: string, location: Location) => {
    const newEntity = createEntity(icon, location);

    setEntities((prevEntities) => {
      return [...prevEntities, newEntity];
    });
  };

  return {
    entities,
    setTextForEntity,
    clearAllEntityText,
    deleteEntity,
    replaceEntity,
    addEntity,
  };
};

export default useEntities;

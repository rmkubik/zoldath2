import React, { useMemo, useState } from "react";
import {
  constructMatrixFromTemplate,
  compareLocations,
  getDimensions,
} from "functional-game-utils";
import Grid from "./grid/Grid";
import usePlayer from "./player/usePlayer";
import useEntities from "./entities/useEntities";
import styled, { createGlobalStyle } from "styled-components";
import sandImg from "./images/sand.jpg";
import Modal from "./ui/Modal";
import Tile from "./grid/Tile";
import Emoji from "./ui/Emoji";
import map from "./grid/map.txt";
import clamp from "./numbers/clamp";
import Center from "./ui/Center";
import "animate.css";

const initialTiles = constructMatrixFromTemplate((character) => {
  return character;
}, map);

const { width, height } = getDimensions(initialTiles);

const GlobalStyle = createGlobalStyle`
  body {
    background-color: #c583ad;
    color: #5d1f47;

    margin: 0;

    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;

    &:before {
      content: ' ';
      display: block;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      opacity: 0.2;
      background-image: url(${sandImg});
      background-repeat: no-repeat;
      background-position: 50% 0;
      background-size: cover;
      z-index: -1;
    }
  }
`;

const ItemRow = styled.div<{ $tileSize: number }>`
  display: flex;
  flex-direction: row;
  gap: 6px;

  flex-wrap: wrap;

  & > * {
    width: ${(props) => props.$tileSize}px;
    height: ${(props) => props.$tileSize}px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${(props) => props.$tileSize}px;
    line-height: ${(props) => props.$tileSize}px;
  }
`;

const ResetButton = styled.button`
  font-weight: bold;
  font-size: 1.5rem;
  color: #5d1f47;
  border: 2px solid #5d1f47;
  box-shadow: 4px 4px #5d1f47;
  cursor: pointer;
`;

const App = () => {
  const [tiles, setTiles] = useState(initialTiles);
  const {
    entities,
    setTextForEntity,
    clearAllEntityText,
    deleteEntity,
    replaceEntity,
    addEntity,
  } = useEntities({
    tiles,
  });
  const {
    playerLocation,
    health,
    items,
    reset: resetPlayer,
  } = usePlayer({
    tiles,
    entities,
    setTextForEntity,
    clearAllEntityText,
    deleteEntity,
    replaceEntity,
    addEntity,
  });

  const isShipRepaired = useMemo(() => {
    const ship = entities.find((entity) => entity.icon === "🛸");
    if (!ship) {
      console.error(`App cannot find a ship on the map.`);
      return;
    }
    if (ship.behavior.type !== "ship") {
      console.error(`Ship has incorrect behavior.`);
      return;
    }
    return ship.behavior.isRepaired;
  }, [entities]);

  return (
    <>
      <GlobalStyle />
      {health <= 0 ? (
        <Modal>
          <p>YOU HAVE SUCCUMBED TO ZOLDATH</p>
          <ResetButton
            onClick={() => {
              resetPlayer();
              setTiles([...initialTiles]);
            }}
            style={{ marginLeft: "1rem" }}
          >
            Reset
          </ResetButton>
        </Modal>
      ) : null}
      {isShipRepaired ? (
        <Modal>
          {" "}
          <p>YOU HAVE ESCAPED FROM ZOLDATH</p>
          <ResetButton
            onClick={() => {
              resetPlayer();
              setTiles([...initialTiles]);
            }}
            style={{ marginLeft: "1rem" }}
          >
            Reset
          </ResetButton>
        </Modal>
      ) : null}
      <Center style={{ flexDirection: "column" }}>
        <div>
          <div style={{ marginBottom: "16px" }}>
            <Grid
              tileSize={48}
              tiles={tiles}
              renderTile={(tile, location) => {
                if (compareLocations(location, playerLocation)) {
                  return <Tile icon="👨‍🚀" />;
                }

                const entityAtLocation = entities.find((entity) =>
                  compareLocations(entity.location, location)
                );

                if (entityAtLocation) {
                  return (
                    <Tile
                      icon={entityAtLocation.icon}
                      text={entityAtLocation.text}
                    />
                  );
                }

                // Hard code always return "."
                // We might want to change this if
                // we want other empty tiles in the
                // future.
                return <Tile icon="." />;
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <ItemRow $tileSize={48}>
              {new Array(clamp(health, 0, 10)).fill("❤️").map((char, index) => (
                <Emoji key={index}>{char}</Emoji>
              ))}
            </ItemRow>
            <ResetButton
              onClick={() => {
                resetPlayer();
                setTiles([...initialTiles]);
              }}
              style={{ marginLeft: "1rem" }}
            >
              Reset
            </ResetButton>
          </div>
          <ItemRow
            $tileSize={48}
            style={{
              minHeight: 48 * 2 + 6 * 1,
              maxWidth: 48 * width + 12 * (width - 1),
            }}
          >
            {items.map((item) => (
              <Emoji className="animate__animated animate__tada" key={item.id}>
                {item.icon}
              </Emoji>
            ))}
          </ItemRow>
        </div>
      </Center>
    </>
  );
};

export default App;

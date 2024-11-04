import React, { Fragment, useMemo } from "react";
import styled from "styled-components";
import { getDimensions, mapMatrix } from "functional-game-utils";

export type Location = {
  row: number;
  col: number;
};

const StyledGrid = styled.div<{
  $tileSize: number;
  $width: number;
  $height: number;
}>`
  display: grid;
  grid-template-columns: ${(props) =>
    (props.$tileSize + "px ").repeat(props.$width)};
  grid-template-rows: ${(props) =>
    (props.$tileSize + "px ").repeat(props.$height)};
  grid-gap: ${(props) => props.$tileSize / 4}px;

  & > div {
    width: ${(props) => props.$tileSize}px;
    height: ${(props) => props.$tileSize}px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${(props) => props.$tileSize}px;
    line-height: ${(props) => props.$tileSize}px;
  }
`;

const Grid = ({ tiles, tileSize, renderTile }) => {
  const { width, height } = useMemo(() => getDimensions(tiles), [tiles]);

  return (
    <StyledGrid $tileSize={tileSize} $width={width} $height={height}>
      {mapMatrix(
        (tile, location) => (
          <Fragment key={JSON.stringify(location)}>
            {renderTile(tile, location)}
          </Fragment>
        ),
        tiles
      )}
    </StyledGrid>
  );
};

export default Grid;

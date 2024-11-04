import React from "react";
import styled from "styled-components";
import {
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import Emoji from "../ui/Emoji";

const Dialogue = styled.span`
  background-color: white;
  box-shadow: 4px 4px #5d1f47;
  border: 3px solid #5d1f47;
  padding: 4px 8px;
  font-size: 1.5rem;
`;

const Tile = ({ icon, text }: { icon: string; text?: string }) => {
  const { refs, floatingStyles } = useFloating({
    placement: "top",
    middleware: [offset(8), shift({ padding: 8 }), flip()],
  });

  if (icon !== ".") {
    return (
      <>
        {text && (
          <FloatingPortal>
            <Dialogue ref={refs.setFloating} style={floatingStyles}>
              {text}
            </Dialogue>
          </FloatingPortal>
        )}
        <Emoji
          className="animate__animated animate__tada"
          ref={refs.setReference}
        >
          {icon}
        </Emoji>
      </>
    );
  }

  return <div>{icon}</div>;
};

export default Tile;

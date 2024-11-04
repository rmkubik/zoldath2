import React, { PropsWithChildren } from "react";
import styled from "styled-components";
import grungeImage from "../images/grunge.jpg";

const StyledModalBackground = styled.div`
  z-index: 1;
  background-color: rgba(80, 0, 0, 0.6);

  &:before {
    content: " ";
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.2;
    background-image: url(${grungeImage});
    background-repeat: no-repeat;
    background-position: 50% 0;
    background-size: cover;
    z-index: -1;
  }

  position: absolute;
  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledModal = styled.div`
  background-color: white;
  box-shadow: 4px 4px black;
  border: 2px solid black;
  padding: 32px;

  font-size: 2rem;
`;

const Modal = ({ children }: PropsWithChildren) => {
  return (
    <StyledModalBackground>
      <StyledModal className="animate__animated animate__slideInUp">
        {children}
      </StyledModal>
    </StyledModalBackground>
  );
};

export default Modal;

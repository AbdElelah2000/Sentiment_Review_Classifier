import React from 'react';
import './modal.css';
import { Button } from '@nextui-org/react';

const Modal = ({ showModal, setShowModal, modalContent }) => {
  return (
    <>
      {showModal ? (
        <div className="modal-background">
          <div className="modal-wrapper">
            <div className="modal-content">
              <h1>{modalContent}</h1>
            </div>
            <div className="modal-close-button" >
              <Button size={'xs'} onPress={() => setShowModal(false)}>X</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Modal;

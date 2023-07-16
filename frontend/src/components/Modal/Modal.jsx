import React from 'react';
import './modal.css';
import { Button } from '@nextui-org/react';
import { PieChart, Pie, Cell } from 'recharts';


const PieChartComponent = ({ positiveCount, negativeCount }) => {
  const data = [
    { name: 'Positive', value: positiveCount },
    { name: 'Negative', value: negativeCount },
  ];

  const COLORS = ['#00fe2a', '#FF0000'];

  return (
    <PieChart width={250} height={100}>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} fill="#8884d8">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  );
};

const Modal = ({ showModal, setShowModal, modalContent, positiveCount, negativeCount }) => {
  return (
    <>
      {showModal ? (
        <div className="modal-background">
          <div className="modal-wrapper">
            <div className="modal-close-button">
              <Button size={'xs'} onPress={() => setShowModal(false)}>
                X
              </Button>
            </div>
            <div className="modal-content">
              <h1>{modalContent}</h1>
              {(positiveCount || negativeCount) && (
                  <div>
                    <PieChartComponent positiveCount={positiveCount} negativeCount={negativeCount} />
                    <p className='postive-p'>Positive: {Math.round((positiveCount/(positiveCount+negativeCount))*100).toFixed(1)}%</p>
                    <p className='negative-p'>Negative: {Math.round((negativeCount/(positiveCount+negativeCount))*100).toFixed(1)}%</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Modal;

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Card, Slide, Typography } from '@mui/material';

const App: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      const model = await cocoSsd.load();
      setInterval(() => {
        detect(model);
      }, 1000);
    };

    const detect = async (model: cocoSsd.ObjectDetection) => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const predictions = await model.detect(video);
        setPredictions(predictions);
        setShowCard(predictions.length > 0); // 推論結果がある場合にカードを表示
      }
    };

    loadModel();
  }, []);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Webcam
        ref={webcamRef}
        videoConstraints={videoConstraints}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {predictions.map((prediction, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            border: '2px solid red',
            left: `${(prediction.bbox[0] / webcamRef.current!.video!.videoWidth) * 100}%`,
            top: `${(prediction.bbox[1] / webcamRef.current!.video!.videoHeight) * 100}%`,
            width: `${(prediction.bbox[2] / webcamRef.current!.video!.videoWidth) * 100}%`,
            height: `${(prediction.bbox[3] / webcamRef.current!.video!.videoHeight) * 100}%`,
            color: 'red',
            fontSize: 'calc(10px + 1vw)',
            fontWeight: 'bold',
          }}
        >
          {prediction.class}
        </div>
      ))}
      <Slide direction="up" in={showCard} mountOnEnter unmountOnExit>
        <Card
          style={{
            position: 'absolute',
            bottom: 0,

            transform: 'translateX(-50%)',
            width: '100%',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <Typography variant="h6">推論結果</Typography>
          {predictions.map((prediction, index) => (
            <Typography key={index}>
              {prediction.class}: {Math.round(prediction.score * 100)}%
            </Typography>
          ))}
        </Card>
      </Slide>
    </div>
  );
};

export default App;
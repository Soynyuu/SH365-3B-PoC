import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Typography, Box } from '@mui/material';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';

const App: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // 初期のカードの高さ: 画面の1割（10%）
  const collapsedHeight = window.innerHeight * 0.1;
  // 展開時のカードの高さ: 画面の4割（40%）
  const expandedHeight = window.innerHeight * 0.4;

  // アニメーション制御
  const [style, api] = useSpring(() => ({ y: collapsedHeight }));

  useEffect(() => {
    const loadModel = async () => {
      const model = await cocoSsd.load();
      setInterval(() => {
        detect(model);
      }, 1000);
    };

    const detect = async (model: cocoSsd.ObjectDetection) => {
      if (webcamRef.current?.video?.readyState === 4) {
        const video = webcamRef.current.video;
        const predictions = await model.detect(video);
        setPredictions(predictions);
      }
    };

    loadModel();
  }, []);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  };

  // ドラッグ操作によるカードのアニメーション制御
  const bind = useDrag(({ down, movement: [, my], direction: [, yDir], velocity }) => {
    const threshold = window.innerHeight * 0.15; // スワイプ距離の閾値
    const trigger = velocity > 0.2; // スワイプ速度の閾値

    if (!down) {
      setIsExpanded((prev) => {
        if (trigger || Math.abs(my) > threshold) {
          return yDir < 0; // 上にスワイプで展開
        }
        return prev;
      });
    }

    api.start({
      y: down ? my : isExpanded ? expandedHeight : collapsedHeight,
      immediate: down,
    });
  });

  // 検出されたオブジェクトのバウンディングボックスを描画
  const renderPredictionBoxes = () => (
    predictions.map((prediction, index) => (
      <Box
        key={index}
        position="absolute"
        border="2px solid red"
        left={`${(prediction.bbox[0] / (webcamRef.current?.video?.videoWidth || 1)) * 100}%`}
        top={`${(prediction.bbox[1] / (webcamRef.current?.video?.videoHeight || 1)) * 100}%`}
        width={`${(prediction.bbox[2] / (webcamRef.current?.video?.videoWidth || 1)) * 100}%`}
        height={`${(prediction.bbox[3] / (webcamRef.current?.video?.videoHeight || 1)) * 100}%`}
        fontSize="calc(8px + 2vw)"
        fontWeight="bold"
        color="red"
      >
        {prediction.class}
      </Box>
    ))
  );

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Webcam
        ref={webcamRef}
        videoConstraints={videoConstraints}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {renderPredictionBoxes()}

      {/* アニメーションカード */}
      <animated.div
        {...bind()}
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: isExpanded ? '40%' : '10%', // カードの高さを設定
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          transform: style.y.to((y) => `translateY(${y}px)`),
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          boxShadow: '0 -5px 15px rgba(0, 0, 0, 0.1)',
          touchAction: 'none', // スワイプ操作を有効にするため
        }}
      >
        <div style={{ padding: '16px', color: 'black' }}>
          <Typography variant="h6">
            {isExpanded ? '虫出禁：効果的な対策' : '虫出禁：'}
          </Typography>
          {isExpanded && (
            <>
              <Typography variant="body2">• フィルターの定期清掃。</Typography>
              <Typography variant="body2">• ドレンホースに防虫キャップ。</Typography>
              <Typography variant="body2">• 隙間を埋める。</Typography>
              <Typography variant="body2">• 虫よけスプレーやアロマ。</Typography>
            </>
          )}
        </div>
      </animated.div>
    </div>
  );
};

export default App;
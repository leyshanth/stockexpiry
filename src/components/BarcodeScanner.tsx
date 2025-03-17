"use client";

import React, { useRef, useEffect, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<MediaDeviceInfo | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Get available cameras
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          // Default to the back camera if available (usually the second camera on mobile)
          const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
          );
          setCamera(backCamera || videoDevices[0]);
        }
      })
      .catch(err => console.error('Error enumerating devices:', err));
  }, []);

  useEffect(() => {
    if (camera && scannerRef.current) {
      Quagga.init({
        inputStream: {
          type: 'LiveStream',
          constraints: {
            width: { min: 450 },
            height: { min: 300 },
            facingMode: 'environment',
            deviceId: camera.deviceId,
            aspectRatio: { min: 1, max: 2 }
          },
          target: scannerRef.current, // This is now safe because we check for null
          area: { // Only search in the center of the video
            top: "25%",
            right: "25%",
            left: "25%",
            bottom: "25%",
          },
        },
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader']
        },
        locate: true
      }, (err) => {
        if (err) {
          console.error('Error initializing Quagga:', err);
          setHasError(true);
          toast.error("Failed to start camera");
          return;
        }
        
        setIsStarted(true);
        Quagga.start();
        
        Quagga.onDetected((result) => {
          if (result && result.codeResult) {
            const code = result.codeResult.code;
            if (code) {
              onDetected(code);
              Quagga.stop();
            }
          }
        });
      });
      
      return () => {
        if (isStarted) {
          try {
            Quagga.stop();
          } catch (error) {
            console.error("Error stopping Quagga:", error);
          }
        }
      };
    }
  }, [camera, onDetected]);

  const switchCamera = () => {
    if (cameras.length > 1) {
      const currentIndex = cameras.findIndex(c => c.deviceId === camera?.deviceId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setCamera(cameras[nextIndex]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Scan Barcode</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        
        {hasError ? (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">Failed to access camera</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please make sure you've granted camera permissions and are using a secure connection (HTTPS).
            </p>
            <Button onClick={onClose}>Close Scanner</Button>
          </div>
        ) : (
          <>
            <div 
              ref={scannerRef} 
              className="relative h-64 w-full overflow-hidden"
            ></div>
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Position the barcode within the camera view
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner; 
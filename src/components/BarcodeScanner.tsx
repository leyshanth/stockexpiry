"use client";

import React, { useRef, useEffect, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    const startScanner = async () => {
      if (!scannerRef.current) return;

      try {
        await Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              width: { min: 640 },
              height: { min: 480 },
              facingMode: "environment", // Use the rear camera
              aspectRatio: { min: 1, max: 2 }
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "code_128_reader",
              "code_39_reader",
              "code_93_reader",
              "upc_reader",
              "upc_e_reader",
            ],
            debug: {
              drawBoundingBox: true,
              showFrequency: true,
              drawScanline: true,
              showPattern: true,
            },
          },
          locate: true,
        });

        Quagga.start();
        setScanning(true);

        // Add event listener for barcode detection
        Quagga.onDetected((result) => {
          if (result && result.codeResult) {
            const code = result.codeResult.code;
            console.log("Barcode detected:", code);
            
            // Stop scanner and call the callback
            Quagga.stop();
            onDetected(code);
          }
        });

        // Add debugging for scanner state
        Quagga.onProcessed((result) => {
          const drawingCtx = Quagga.canvas.ctx.overlay;
          const drawingCanvas = Quagga.canvas.dom.overlay;

          if (result) {
            if (result.boxes) {
              drawingCtx.clearRect(
                0,
                0,
                parseInt(drawingCanvas.getAttribute("width")),
                parseInt(drawingCanvas.getAttribute("height"))
              );
              result.boxes.filter((box) => box !== result.box).forEach((box) => {
                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
                  color: "green",
                  lineWidth: 2,
                });
              });
            }

            if (result.box) {
              Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
                color: "#00F",
                lineWidth: 2,
              });
            }

            if (result.codeResult && result.codeResult.code) {
              Quagga.ImageDebug.drawPath(
                result.line,
                { x: "x", y: "y" },
                drawingCtx,
                { color: "red", lineWidth: 3 }
              );
            }
          }
        });

      } catch (error) {
        console.error("Error starting barcode scanner:", error);
        setCameraError(true);
        toast.error("Failed to access camera. Please check permissions.");
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      if (scanning) {
        Quagga.stop();
      }
    };
  }, [onDetected]);

  const handleManualEntry = () => {
    const barcode = prompt("Enter barcode manually:");
    if (barcode && barcode.trim() !== "") {
      onDetected(barcode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Scan Barcode</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Position the barcode within the scanner area
          </p>
        </div>
        
        {cameraError ? (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-4">
              Camera access failed. Please check your permissions or try manual entry.
            </p>
            <Button onClick={handleManualEntry}>Enter Barcode Manually</Button>
          </div>
        ) : (
          <div 
            ref={scannerRef} 
            className="w-full h-64 md:h-80 relative overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4/5 h-1/3 border-2 border-red-500 border-dashed rounded-lg"></div>
            </div>
          </div>
        )}
        
        <div className="p-4 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleManualEntry}>
            Enter Manually
          </Button>
        </div>
      </div>
    </div>
  );
} 
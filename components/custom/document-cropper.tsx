"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";

type DocumentCropperProps = {
  onReadContent?: (croppedImage: string) => void;
};

export default function DocumentCropper({
  onReadContent,
}: DocumentCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropStart = useRef<{ x: number; y: number } | null>(null);
  const cropRect = useRef<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        setImageSrc(src);
        setOriginalImage(src);
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      alert("PDF support not implemented yet.");
    } else {
      alert("Unsupported file type. Please upload an image or PDF.");
    }
  };

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => setImgObj(img);
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw image on canvas (scaled)
  useEffect(() => {
    if (!imgObj || !canvasRef.current) return;

    const maxWidth = 800;
    const maxHeight = 600;
    let s = 1;

    if (imgObj.width > maxWidth || imgObj.height > maxHeight) {
      s = Math.min(maxWidth / imgObj.width, maxHeight / imgObj.height);
    }

    const canvas = canvasRef.current;
    canvas.width = imgObj.width * s;
    canvas.height = imgObj.height * s;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
  }, [imgObj]);

  const getMousePos = (e: React.MouseEvent) => {
  const rect = canvasRef.current!.getBoundingClientRect();
  const scaleX = canvasRef.current!.width / rect.width;
  const scaleY = canvasRef.current!.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};

const handleMouseDown = (e: React.MouseEvent) => {
  if (!canvasRef.current) return;
  cropStart.current = getMousePos(e);
  setCropping(true);
};

const handleMouseMove = (e: React.MouseEvent) => {
  if (!cropping || !canvasRef.current || !cropStart.current || !imgObj) return;
  const ctx = canvasRef.current.getContext("2d");
  if (!ctx) return;

  const pos = getMousePos(e);
  const w = pos.x - cropStart.current.x;
  const h = pos.y - cropStart.current.y;

  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  ctx.drawImage(imgObj, 0, 0, canvasRef.current.width, canvasRef.current.height);

  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(cropStart.current.x, cropStart.current.y, w, h);

  cropRect.current = { x: cropStart.current.x, y: cropStart.current.y, w, h };
};
  const handleMouseUp = () => setCropping(false);

  const cropImage = () => {
    if (!imgObj || !canvasRef.current) return;
    const { x, y, w, h } = cropRect.current;

    // Calculate proportion of crop relative to displayed canvas
    const canvas = canvasRef.current;
    const sx = (w < 0 ? x + w : x) * (imgObj.width / canvas.width);
    const sy = (h < 0 ? y + h : y) * (imgObj.height / canvas.height);
    const sw = Math.abs(w) * (imgObj.width / canvas.width);
    const sh = Math.abs(h) * (imgObj.height / canvas.height);

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = sw;
    cropCanvas.height = sh;

    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(imgObj, sx, sy, sw, sh, 0, 0, sw, sh);

    setImageSrc(cropCanvas.toDataURL("image/png"));
  };

  const resetImage = () => {
    setImageSrc(originalImage);
  };

  const handleRemove = () => {
    setImageSrc(null);
    setImgObj(null);
    setOriginalImage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleReadContent = () => {
    if (imageSrc && onReadContent) {
      onReadContent(imageSrc);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFile}
        className="inline-block w-auto"
      />
      {imageSrc && (
        <>
          <canvas
            ref={canvasRef}
            style={{
              border: "1px solid #ccc",
              cursor: "crosshair",
              maxWidth: "100%",
              height: "auto",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          {imageSrc == originalImage && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <Button onClick={cropImage}>Crop</Button>
              <Button variant="outline" onClick={handleRemove}>
                Remove
              </Button>
            </div>
          )}
          {imageSrc != originalImage && (
            <div className="mt-t flex gap-2 flex-wrap">
              <Button onClick={handleReadContent}>Read Content</Button>
              <Button onClick={resetImage} variant="outline">
                Crop Again
              </Button>
              <Button variant="outline" onClick={handleRemove}>
                Remove
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import DocumentCropper from "@/components/custom/document-cropper";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";
import { error } from "console";
import { Copy, CopyIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";

const Page = () => {
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [categorizedContent, setCategorizedContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onReadContent = (croppedImage: string) => {
    setCroppedImage(croppedImage);
    setCategorizedContent("");
  };

  useEffect(() => {
    if (!croppedImage) return;

    setOcrText("Processing OCR...");

    Tesseract.recognize(croppedImage, "eng", { logger: (m) => console.log(m) })
      .then(({ data: { text } }) => {
        setOcrText(text);
      })
      .catch((err) => {
        console.error(err);
        setOcrText("Error reading text");
      });
  }, [croppedImage]);

  const categorizeContent = async () => {
    if (!ocrText) return;
    setLoading(true);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText }),
      });
      const data = await res.json();
      console.log("Server response full:", data);
      const messageContent = data?.choices?.[0]?.message?.content ?? "No content returned...";
      setCategorizedContent(messageContent);
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy= async ()=>{
    try{
      await navigator.clipboard.writeText(categorizedContent);
    }catch(e){
      console.log('Failed to copy content: ', e);
    }
  }

  console.log("categorized content: ", categorizedContent);

  return (
    <div className="p-6 min-h-screen">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-20">
    {/* Left Column - Image Cropper */}
    <div className="bg-white p-4 rounded-lg shadow flex flex-col min-h-[80vh] border border-gray-300">
      <h2 className="text-lg font-bold mb-4">Upload & Crop</h2>
      <DocumentCropper onReadContent={onReadContent} />
    </div>

    {/* Middle Column - OCR Text */}
    <div className="bg-white p-4 rounded-lg shadow flex flex-col h-[80vh] border border-gray-300">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Recognized Text</h2>
        <Button onClick={categorizeContent} disabled={loading}>
          {loading ? "Categorizing..." : "Categorize"}
        </Button>
      </div>
      <Textarea
        value={ocrText}
        onChange={(e) => setOcrText(e.target.value)}
        placeholder="OCR recognized text will appear here..."
        className="flex-1 resize-none overflow-y-auto"
      />
    </div>

    {/* Right Column - Categorized Content */}
    <div className="bg-white p-4 rounded-lg shadow flex flex-col h-[80vh] border border-gray-300">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold mb-3">Categorized Content</h2>
        <Button onClick={handleCopy}>
            <CopyIcon className="w-10 h-10"/>
        </Button>
      </div>
       <Textarea
        value={categorizedContent}
        onChange={(e) => setCategorizedContent(e.target.value)}
        placeholder="Categorized text will appear here..."
        className="flex-1 resize-none overflow-y-auto"
      />
    </div>
  </div>
</div>

  );
};

export default Page;

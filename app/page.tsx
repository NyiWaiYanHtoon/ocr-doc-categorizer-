"use client";

import React, { useState, useEffect } from "react";
import DocumentCropper from "@/components/custom/document-cropper";
import { Button } from "@/components/shadcn/button";
import { Textarea } from "@/components/shadcn/textarea";
import { CheckIcon, CopyIcon } from "lucide-react";
import Tesseract from "tesseract.js";

const Page: React.FC = () => {
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [categorizedContent, setCategorizedContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  const recognizeWithTesseract = async (image: string) => {
    try {
      setOcrText("Processing OCR...");
      const { data } = await Tesseract.recognize(image, "eng", {
        logger: (m) => console.log(m),
      });
      setOcrText(data.text);
    } catch (err) {
      console.error(err);
      setOcrText("Error reading text with Tesseract");
    }
  };

  const recognizeWithOCRSpace = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    try {
      setOcrText("Processing OCR...");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setOcrText("Error: Unable to process OCR");
        return;
      }

      const data = await res.json();
      console.log("OCR Data:", data);
      const result =
        data.ParsedResults?.[0]?.ParsedText ||
        "Couldn't read. Please try a smaller file.";
      setOcrText(result);
    } catch (err) {
      console.error(err);
      setOcrText("Error reading text");
    }
  };

  const handleTesseractREad = (image: string) => {
    setCroppedImage(image);
    setCategorizedContent("");
  };

  const handleOCRSpaceRead = (selectedFile: File | null) => {
    setFile(selectedFile);
    setCategorizedContent("");
  };

  useEffect(() => {
    if (croppedImage) {
      recognizeWithTesseract(croppedImage);
    } else {
      setOcrText("");
      setCategorizedContent("");
    }
  }, [croppedImage]);

  useEffect(() => {
    if (file) {
      recognizeWithOCRSpace(file);
    } else {
      setOcrText("");
      setCategorizedContent("");
    }
  }, [file]);

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
      const messageContent =
        data?.choices?.[0]?.message?.content ||
        "Please try again with a sharper image or clearer text.";

      setCategorizedContent(messageContent);
    } catch (err) {
      console.error("Error categorizing content:", err);
      setCategorizedContent("Error categorizing content.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(categorizedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-20">
        {/* Left Column - Upload & Crop */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-col min-h-[80vh] border border-gray-300">
          <h2 className="text-lg font-bold mb-4">Upload & Crop</h2>
          <DocumentCropper
            readTesseract={handleTesseractREad}
            readOcrSpace={handleOCRSpaceRead}
          />
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
            <h2 className="text-lg font-bold">Categorized Content</h2>
            <Button onClick={handleCopy} className="cursor-pointer">
              {copied ? (
                <>
                  <CheckIcon className="w-5 h-5" /> Copied
                </>
              ) : (
                <>
                  <CopyIcon className="w-5 h-5" /> Copy
                </>
              )}
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

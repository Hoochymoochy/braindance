"use client";

import React, { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { uploadPartyImage } from "@/app/lib/photos/uploadImage"
import Image from "next/image";;
import { addPhoto } from "@/app/lib/photos/photo";

export default function PhotoUpload() {
  const { eventId } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setStatus("idle");
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setStatus("idle");
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const handleUpload = async () => {
    if (!file || !eventId) {
      setStatus("error");
      return;
    }

    try {
      setStatus("uploading");
      const progressInterval = simulateProgress();
      
      const url = await uploadPartyImage(file, eventId as string);
      await addPhoto(url, eventId as string);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setStatus("success");
        setFile(null);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error("Upload failed:", err);
      setStatus("error");
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black thermal-background px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-purple-900/50 bg-black/60 p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] transform transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:scale-[1.02]">
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 animate-pulse">
          📷 Upload a Photo
        </h1>

        {/* Drag and Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 mb-4 transition-all duration-300 cursor-pointer ${
            isDragOver 
              ? 'border-purple-400 bg-purple-900/20 scale-105' 
              : 'border-purple-900/50 hover:border-purple-600/70 hover:bg-purple-900/10'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={triggerFileInput}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="text-center">
            <div className={`text-4xl mb-2 transition-transform duration-300 ${isDragOver ? 'scale-125' : ''}`}>
              {isDragOver ? '⬇️' : '📁'}
            </div>
            <p className="text-purple-300 text-sm mb-1">
              {isDragOver ? 'Drop your photo here!' : 'Click to select or drag & drop'}
            </p>
            <p className="text-gray-500 text-xs">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>

        {file && (
          <div className="mb-4 animate-fade-in">
            <p className="text-sm text-gray-400 mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Preview:
            </p>
            <div className="relative group">
              <div className="relative w-full h-48 rounded-md overflow-hidden border border-purple-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)] group-hover:scale-[1.02] transition-transform duration-300">
                <Image
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setStatus("idle");
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">{file.name}</p>
          </div>
        )}

        {/* Upload Progress Bar */}
        {status === "uploading" && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-purple-300 mb-1">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-purple-900/30 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || status === "uploading"}
          className={`w-full py-3 font-semibold rounded-md transition-all duration-300 transform ${
            !file || status === "uploading"
              ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-pink-600 text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
          }`}
        >
          {status === "uploading" ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : (
            "✨ Submit Photo"
          )}
        </button>

        {/* Status Messages with Enhanced Animations */}
        {status === "success" && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-md animate-bounce-in">
            <p className="text-green-400 text-center font-medium flex items-center justify-center">
              <span className="text-xl mr-2">🎉</span>
              Photo uploaded for review!
            </p>
          </div>
        )}
        
        {status === "error" && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-md animate-shake">
            <p className="text-red-400 text-center font-medium flex items-center justify-center">
              <span className="text-xl mr-2">❌</span>
              Upload failed. Try again.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          50% { opacity: 1; transform: scale(1.1) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
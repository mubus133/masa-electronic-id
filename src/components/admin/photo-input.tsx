"use client";

import { useRef, type ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button, Photo } from "@/components/ui";

// Square-crops and shrinks the photo to 480px so profiles stay light.
export const squarePhoto = (file: File, size = 480) =>
  new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas
        .getContext("2d")!
        .drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as a photo."));
    };
    image.src = url;
  });

export const PhotoInput = ({ value, name, onChange }: { value: string | null; name: string; onChange: (value: string | null) => void }) => {
  const input = useRef<HTMLInputElement>(null);
  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      onChange(await squarePhoto(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't use that photo.");
    }
  };
  return (
    <div className="flex items-center gap-4">
      <Photo src={value} name={name || "New student"} size="lg" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input ref={input} type="file" accept="image/*" capture="user" className="sr-only" onChange={pick} />
        <Button variant="secondary" size="sm" onClick={() => input.current?.click()}><Camera className="size-4" /> {value ? "Change photo" : "Add photo"}</Button>
        {value && <Button variant="ghost" size="sm" onClick={() => onChange(null)}>Remove</Button>}
      </div>
    </div>
  );
};

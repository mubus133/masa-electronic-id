"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/shell/session";
import { Button, Field, Input, LoadingBlock, Notice, PageHeader, Panel, PanelBody, PanelHeader, Textarea } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import { can } from "@/lib/permissions";
import type { SiteContent } from "@/lib/services/site-content";

const MAX_WIDTH = 2000;

// Shrinks the photo in the browser so the saved file stays small (about 200–500 KB).
const resizePhoto = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as a photo."));
    };
    image.src = url;
  });

export default function WebsitePage() {
  const { actor } = useSession();
  const { data, error, loading, reload } = useResource<{ content: SiteContent }>("/api/site-content");
  const [edits, setEdits] = useState<SiteContent | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const draft = edits ?? data?.content ?? null;

  if (!can(actor, "website.edit")) {
    return <Notice tone="warn" title="No access">You need the “Edit website” permission to change the website.</Notice>;
  }

  const update = (key: keyof SiteContent, value: string) => setEdits((current) => {
    const base = current ?? data?.content;
    return base ? { ...base, [key]: value } : null;
  });

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error("Choose a JPEG, PNG or WebP photo.");
      return;
    }
    try {
      update("hero_image", await resizePhoto(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't use that photo.");
    }
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await api("/api/site-content", { method: "PATCH", body: draft });
      await reload();
      setEdits(null);
      toast.success("Website updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  const dirty = Boolean(edits && data && JSON.stringify(edits) !== JSON.stringify(data.content));

  return (
    <>
      <PageHeader
        title="Website"
        description="The home page that everyone sees before signing in."
        actions={<Button onClick={save} busy={busy} disabled={!dirty}>Save changes</Button>}
      />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      {loading || !draft ? (
        <Panel><LoadingBlock /></Panel>
      ) : (
        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Home page photo" description="Shown behind the headline. A wide landscape photo of a class works best." />
            <PanelBody className="space-y-4">
              <div className="relative isolate aspect-[16/9] overflow-hidden rounded-lg bg-brand-ink sm:aspect-[16/7]">
                {draft.hero_image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local preview of the uploaded photo
                  <img src={draft.hero_image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_20%,#2c7a60_0%,#123b2d_55%,#0c2a20_100%)]" />
                )}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0c2a20]/90 via-[#0c2a20]/70 to-[#0c2a20]/30" />
                <div className="flex h-full max-w-[70%] flex-col justify-center p-4 sm:p-8">
                  <p className="line-clamp-3 text-lg leading-snug font-semibold text-white sm:text-2xl">{draft.hero_title}</p>
                  <p className="mt-2 line-clamp-2 hidden text-sm text-white/80 sm:block">{draft.hero_text}</p>
                </div>
                {!draft.hero_image && (
                  <span className="absolute right-3 bottom-3 rounded-full bg-white/15 px-2.5 py-1 text-xs text-white">No photo yet</span>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickPhoto} />
                <Button variant="secondary" onClick={() => fileInput.current?.click()}>
                  <ImagePlus className="size-4" /> {draft.hero_image ? "Replace photo" : "Upload photo"}
                </Button>
                {draft.hero_image && (
                  <Button variant="ghost" onClick={() => update("hero_image", "")}>
                    <Trash2 className="size-4" /> Remove photo
                  </Button>
                )}
              </div>
              <Field label="Photo description" hint="Read aloud by screen readers.">
                {(props) => <Input {...props} value={draft.hero_image_alt} onChange={(event) => update("hero_image_alt", event.target.value)} maxLength={160} />}
              </Field>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Text" />
            <PanelBody className="space-y-5">
              <Field label="Headline">
                {(props) => <Input {...props} value={draft.hero_title} onChange={(event) => update("hero_title", event.target.value)} maxLength={120} />}
              </Field>
              <Field label="Introduction">
                {(props) => <Textarea {...props} rows={3} value={draft.hero_text} onChange={(event) => update("hero_text", event.target.value)} maxLength={400} />}
              </Field>
              <Field label="Announcement" optional hint="A short notice shown in a strip above the photo, e.g. a change to this week's timetable. Leave empty to hide it.">
                {(props) => <Textarea {...props} rows={2} value={draft.announcement} onChange={(event) => update("announcement", event.target.value)} maxLength={300} />}
              </Field>
            </PanelBody>
          </Panel>

          <div className="flex justify-end">
            <Button onClick={save} busy={busy} disabled={!dirty} className="w-full sm:w-auto">Save changes</Button>
          </div>
        </div>
      )}
    </>
  );
}

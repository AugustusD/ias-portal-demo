"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ReferenceDoc = {
  name: string;
  description: string;
  url: string;
};

type QuizOption = { label: string; text: string };

type QuizQuestion = {
  id: string;
  category?: string;
  question: string;
  options: QuizOption[];
  correctLabel: string;
};

type Module = {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoId?: string;
  type: "video" | "form" | "quiz";
  references?: ReferenceDoc[];
  questions?: QuizQuestion[];
  passThresholdPct?: number;
};

const MODULES: Module[] = [
  {
    id: "welcome",
    title: "Welcome to Innovative",
    description: "An introduction to IAS, our products, and what it means to be an authorized dealer.",
    duration: "3 min",
    videoId: "8rBR4K4E9TA",
    type: "video",
  },
  {
    id: "dealer-setup",
    title: "Tell us about your business",
    description: "Submit the new customer form so IAS can finalize your dealer account.",
    duration: "5 min",
    type: "form",
  },
  {
    id: "products",
    title: "Product Family Overview",
    description: "Walk through our four product lines: Infinity Topless, Glass Component, Picket, and Custom railings. Open-book quiz at the end.",
    duration: "6 min",
    type: "quiz",
    passThresholdPct: 80,
    references: [
      { name: "Infinity Topless Sell Sheet", description: "Product overview for our flagship topless glass system.", url: "/documents/sellsheet_infinity.pdf" },
      { name: "Glass Component Sell Sheet", description: "Product overview for component glass railings.", url: "/documents/sellsheet_glass.pdf" },
      { name: "Picket Sell Sheet", description: "Product overview for welded picket systems.", url: "/documents/sellsheet_picket.pdf" },
      { name: "Custom Railings Sell Sheet", description: "Product overview for custom aluminum railing options.", url: "/documents/sellsheet_custom.pdf" },
      { name: "Powder Coating Sell Sheet", description: "Our 5-stage AAMA 2604 powder coating process and color options.", url: "/documents/sellsheet_powdercoating.pdf" },
    ],
    questions: [
      {
        id: "p1",
        question: 'Which IAS railing system is "topless" — no horizontal top rail across the glass?',
        options: [
          { label: "A", text: "Welded Picket" },
          { label: "B", text: "Component Glass" },
          { label: "C", text: "Infinity" },
        ],
        correctLabel: "C",
      },
      {
        id: "p2",
        question: "The standard IAS powder coating meets which AAMA spec — better than the basic 2603 used by many competitors?",
        options: [
          { label: "A", text: "AAMA 2603" },
          { label: "B", text: "AAMA 2604" },
          { label: "C", text: "AAMA 2602" },
        ],
        correctLabel: "B",
      },
      {
        id: "p3",
        question: "How many Innovative Series standard powder coat colors are offered?",
        options: [
          { label: "A", text: "8" },
          { label: "B", text: "14" },
          { label: "C", text: "20" },
        ],
        correctLabel: "B",
      },
      {
        id: "p4",
        question: "How many top rail profiles are offered across the Picket, Glass, and Flex Rail lines?",
        options: [
          { label: "A", text: "2 (Square, Round)" },
          { label: "B", text: "4 (Square, Round, Flat, Colonial)" },
          { label: "C", text: "6" },
        ],
        correctLabel: "B",
      },
      {
        id: "p5",
        question: 'Which product line offers BOTH 5/8" picket and broad slat designs?',
        options: [
          { label: "A", text: "Glass Railing" },
          { label: "B", text: "Welded Picket" },
          { label: "C", text: "Custom" },
        ],
        correctLabel: "B",
      },
      {
        id: "p6",
        question: "What is the standard limited warranty term across all IAS product lines (per the sell sheets)?",
        options: [
          { label: "A", text: "10 years" },
          { label: "B", text: "15 years" },
          { label: "C", text: "20 years" },
        ],
        correctLabel: "C",
      },
    ],
  },
  {
    id: "installation",
    title: "Installation Fundamentals",
    description: "Core principles across all IAS railing systems: mounting types, post spacing, engineering requirements, and code compliance. Open-book quiz covering Picket, Glass, Flex Rail, and Infinity.",
    duration: "15 min",
    type: "quiz",
    passThresholdPct: 80,
    references: [
      { name: "Infinity Fascia Installation Guide", description: "Fascia mount installation reference for Infinity Topless systems.", url: "/documents/InfinityInstallationGuideFascia.pdf" },
      { name: "Infinity Surface Installation Guide", description: "Surface mount installation reference for Infinity Topless systems.", url: "/documents/InfinityInstallationGuideSurface.pdf" },
      { name: "Wall Track Installation Guide", description: "Complete wall track application reference.", url: "/documents/InstallationGuideWallTrackComplete.pdf" },
      { name: "Flex Rail Installation Guide", description: "Flex rail installation reference.", url: "/documents/Installation_Guide-Flex_Rail.pdf" },
      { name: "Glass Installation Reference", description: "Glass measurement, ordering, and installation.", url: "/documents/installation_glass.pdf" },
      { name: "Picket Installation Reference", description: "Welded picket installation specifics.", url: "/documents/installation_picket.pdf" },
      { name: "Stairs Installation Reference", description: "Stair railing installation for sloped applications.", url: "/documents/installation_stairs.pdf" },
    ],
    questions: [
      // Picket
      {
        id: "i-pk-1",
        category: "Picket",
        question: "How much shorter should a mid post with a center sleeve be than a regular mid post with a post mount plate?",
        options: [
          { label: "A", text: '0"' },
          { label: "B", text: '1/8"' },
          { label: "C", text: '1/4"' },
        ],
        correctLabel: "B",
      },
      {
        id: "i-pk-2",
        category: "Picket",
        question: "Before they are cut, how tall are stair posts (as measured above the tread)?",
        options: [
          { label: "A", text: '40 1/4"' },
          { label: "B", text: '36"' },
          { label: "C", text: '42"' },
        ],
        correctLabel: "A",
      },
      {
        id: "i-pk-3",
        category: "Picket",
        question: "Per code, what is the maximum diameter sphere that should be unable to pass through a stair railing?",
        options: [
          { label: "A", text: '4"' },
          { label: "B", text: '6"' },
          { label: "C", text: '8"' },
        ],
        correctLabel: "B",
      },
      {
        id: "i-pk-4",
        category: "Picket",
        question: "What is the maximum allowed gap between an end post and a wall?",
        options: [
          { label: "A", text: '2"' },
          { label: "B", text: '4"' },
          { label: "C", text: '6"' },
        ],
        correctLabel: "B",
      },
      {
        id: "i-pk-5",
        category: "Picket",
        question: "For surface mount, how far from the deck edge does the edge of the baseplate typically sit?",
        options: [
          { label: "A", text: '1/2"' },
          { label: "B", text: '1"' },
          { label: "C", text: '2"' },
        ],
        correctLabel: "B",
      },
      // Glass
      {
        id: "i-gl-1",
        category: "Glass",
        question: "What is the typical gap between a glass panel and the edge of its opening?",
        options: [
          { label: "A", text: '1/2" to 1"' },
          { label: "B", text: "2 – 3 inches" },
          { label: "C", text: "4 – 5 inches" },
        ],
        correctLabel: "B",
      },
      {
        id: "i-gl-2",
        category: "Glass",
        question: "At what angle are top rail miter cuts at the component post mount plates?",
        options: [
          { label: "A", text: "30 degrees" },
          { label: "B", text: "45 degrees" },
          { label: "C", text: "90 degrees" },
        ],
        correctLabel: "B",
      },
      {
        id: "i-gl-3",
        category: "Glass",
        question: "When installing a glass panel, what is the correct sequence?",
        options: [
          { label: "A", text: "Push down → Slide over → Lift up" },
          { label: "B", text: "Lift up → Slide over → Push down" },
          { label: "C", text: "Slide over → Push down → Lift up" },
        ],
        correctLabel: "B",
      },
      {
        id: "i-gl-4",
        category: "Glass",
        question: 'On a 2 1/2" end post wall mount, what is the distance from the top of the base plate to the bottom of the sleeve plate?',
        options: [
          { label: "A", text: '39"' },
          { label: "B", text: '40"' },
          { label: "C", text: '42"' },
        ],
        correctLabel: "A",
      },
      {
        id: "i-gl-5",
        category: "Glass",
        question: "What allowance must you give at every sleeve when sizing top rails?",
        options: [
          { label: "A", text: '1/8"' },
          { label: "B", text: '1/2"' },
          { label: "C", text: '1"' },
        ],
        correctLabel: "B",
      },
      // Flex Rail
      {
        id: "i-fx-1",
        category: "Flex Rail",
        question: "When the bottom rail terminates in a wall mount, how much should you deduct from the panel's bottom rail at that end?",
        options: [
          { label: "A", text: '1/8"' },
          { label: "B", text: '1/2"' },
          { label: "C", text: '1"' },
        ],
        correctLabel: "B",
      },
      {
        id: "i-fx-2",
        category: "Flex Rail",
        question: "How many tec screws secure a flex-rail insert panel to the top rail from below?",
        options: [
          { label: "A", text: "2" },
          { label: "B", text: "3" },
          { label: "C", text: "4" },
        ],
        correctLabel: "B",
      },
      {
        id: "i-fx-3",
        category: "Flex Rail",
        question: "Which top rail profile is typically disallowed on stair applications (unless a separate handrail is added)?",
        options: [
          { label: "A", text: "Square" },
          { label: "B", text: "Round" },
          { label: "C", text: "Flat" },
        ],
        correctLabel: "C",
      },
      {
        id: "i-fx-4",
        category: "Flex Rail",
        question: "For a stair angle of 22°–25°, what is the trim dimension at the post top (per the trim table)?",
        options: [
          { label: "A", text: '2"' },
          { label: "B", text: '2 1/8"' },
          { label: "C", text: '2 3/16"' },
        ],
        correctLabel: "B",
      },
      {
        id: "i-fx-5",
        category: "Flex Rail",
        question: "Inside sleeve posts (used to extend a run beyond 20') — are they trimmed down like normal sleeve posts?",
        options: [
          { label: "A", text: 'Yes, trim 1/8" shorter' },
          { label: "B", text: "No, they are NOT trimmed down" },
          { label: "C", text: 'Yes, trim 1/4" shorter' },
        ],
        correctLabel: "B",
      },
      // Infinity
      {
        id: "i-in-1",
        category: "Infinity",
        question: "When cutting the vinyl insert, how much of a gap should be left for thermal expansion and contraction?",
        options: [
          { label: "A", text: '1/4"' },
          { label: "B", text: '1/8" to 3/16"' },
          { label: "C", text: '1/2"' },
        ],
        correctLabel: "B",
      },
      {
        id: "i-in-2",
        category: "Infinity",
        question: "How far above deck level should setting blocks stop?",
        options: [
          { label: "A", text: '1"' },
          { label: "B", text: '2 1/8"' },
          { label: "C", text: '3"' },
        ],
        correctLabel: "B",
      },
      {
        id: "i-in-3",
        category: "Infinity",
        question: "What is the recommended maximum length for a single setting block piece?",
        options: [
          { label: "A", text: "3 inches" },
          { label: "B", text: "5 inches" },
          { label: "C", text: "8 inches" },
        ],
        correctLabel: "B",
      },
      {
        id: "i-in-4",
        category: "Infinity",
        question: "What size allen key tightens the set screw on the glass wedge?",
        options: [
          { label: "A", text: '3/32"' },
          { label: "B", text: '1/8"' },
          { label: "C", text: '5/32"' },
        ],
        correctLabel: "A",
      },
      {
        id: "i-in-5",
        category: "Infinity",
        question: "For fascia mount, approximately how many degrees should corner and end posts be shimmed to lean?",
        options: [
          { label: "A", text: "1°" },
          { label: "B", text: "5°" },
          { label: "C", text: "10°" },
        ],
        correctLabel: "A",
      },
      {
        id: "i-in-6",
        category: "Infinity",
        question: 'How many #10 × 3/4" tek screws attach the fascia plates to each post?',
        options: [
          { label: "A", text: "2" },
          { label: "B", text: "4" },
          { label: "C", text: "6" },
        ],
        correctLabel: "B",
      },
    ],
  },
  {
    id: "warranty",
    title: "Warranty, Claims & Customer Support",
    description: "Understand the 20-year structural warranty, what's covered, and the care instructions that keep coverage valid. Open-book quiz at the end.",
    duration: "8 min",
    type: "quiz",
    passThresholdPct: 80,
    references: [
      { name: "Residential Warranty", description: "Full residential warranty terms — 20 year structural, 10 year finish.", url: "/documents/INNOVATIVE ALUMINUM RESIDENTIAL WARRANTY.pdf" },
      { name: "Commercial Warranty", description: "Commercial warranty terms — 20 year structural, 5 year finish.", url: "/documents/INNOVATIVE ALUMINUM COMMERCIAL WARRANTY.pdf" },
    ],
    questions: [
      {
        id: "w1",
        question: "How long is the structural defect warranty on the IAS Residential warranty?",
        options: [
          { label: "A", text: "10 years" },
          { label: "B", text: "20 years" },
          { label: "C", text: "Lifetime" },
        ],
        correctLabel: "B",
      },
      {
        id: "w2",
        question: "How long is the residential powder coat finish warranty?",
        options: [
          { label: "A", text: "5 years" },
          { label: "B", text: "10 years" },
          { label: "C", text: "20 years" },
        ],
        correctLabel: "B",
      },
      {
        id: "w3",
        question: "How long is the commercial powder coat warranty (vs. 10 years for residential)?",
        options: [
          { label: "A", text: "5 years" },
          { label: "B", text: "3 years" },
          { label: "C", text: "Same 10 years" },
        ],
        correctLabel: "A",
      },
      {
        id: "w4",
        question: "The residential powder coat warranty reduces to how many years if the product is installed within 5 miles of the ocean?",
        options: [
          { label: "A", text: "1 year" },
          { label: "B", text: "5 years" },
          { label: "C", text: "10 years" },
        ],
        correctLabel: "B",
      },
      {
        id: "w5",
        question: "After discovering a problem, how long does the customer have to submit a warranty claim in writing?",
        options: [
          { label: "A", text: "7 days" },
          { label: "B", text: "30 days" },
          { label: "C", text: "90 days" },
        ],
        correctLabel: "B",
      },
      {
        id: "w6",
        question: "The warranty does NOT cover corrosion of which component?",
        options: [
          { label: "A", text: "Powder coat" },
          { label: "B", text: "Screws and other fastening devices" },
          { label: "C", text: "Aluminum extrusions" },
        ],
        correctLabel: "B",
      },
      {
        id: "w7",
        question: "Is the warranty transferable to a new owner if the home is sold?",
        options: [
          { label: "A", text: "Yes, automatically" },
          { label: "B", text: "Yes, with paperwork" },
          { label: "C", text: "No — original purchaser only" },
        ],
        correctLabel: "C",
      },
      {
        id: "w8",
        question: "How often must fasteners be inspected and tightened to maintain warranty eligibility?",
        options: [
          { label: "A", text: "Once a year" },
          { label: "B", text: "Once a month" },
          { label: "C", text: "Every 5 years" },
        ],
        correctLabel: "A",
      },
      {
        id: "w9",
        question: "Within 1 mile of saltwater, how often is cleaning and inspection required?",
        options: [
          { label: "A", text: "Weekly" },
          { label: "B", text: "Monthly" },
          { label: "C", text: "Annually" },
        ],
        correctLabel: "B",
      },
      {
        id: "w10",
        question: "Which finish type should NOT be car-waxed (per the care instructions)?",
        options: [
          { label: "A", text: "Gloss White" },
          { label: "B", text: "Matte or Textured Finishes" },
          { label: "C", text: "Sandalwood" },
        ],
        correctLabel: "B",
      },
    ],
  },
];

const GUEST_PROGRESS_KEY = "ias_guest_onboarding_progress";
const GUEST_FORM_KEY = "ias_guest_customer_form_submitted";
const PENDING_SIGNUP_KEY = "ias_pending_signup";
const REGISTRATION_TOKEN_KEY = "ias_registration_token";

function SlideToComplete({
  onComplete,
  label = "Slide to Complete",
  autoComplete = false,
}: {
  onComplete: () => void;
  label?: string;
  autoComplete?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);

  function handleStart() { if (completed) return; setIsDragging(true); }

  function handleMove(clientX: number) {
    if (!isDragging || completed || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const knobWidth = 56;
    const maxPosition = rect.width - knobWidth;
    const newPosition = Math.max(0, Math.min(maxPosition, clientX - rect.left - knobWidth / 2));
    setPosition(newPosition);
    if (newPosition >= maxPosition * 0.92) {
      setCompleted(true);
      setPosition(maxPosition);
      setIsDragging(false);
      setTimeout(() => onComplete(), 400);
    }
  }

  function handleEnd() { if (completed) return; setIsDragging(false); setPosition(0); }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) { handleMove(e.clientX); }
    function onTouchMove(e: TouchEvent) { if (e.touches[0]) handleMove(e.touches[0].clientX); }
    function onUp() { handleEnd(); }
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchend", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  // Auto-complete: when triggered (e.g. right after form submit), animate the
  // knob across and fire onComplete. Per Fred's meeting feedback — submit
  // shouldn't make the user then manually slide.
  useEffect(() => {
    if (!autoComplete || completed) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const knobWidth = 56;
    const maxPosition = rect.width - knobWidth;
    // brief delay so the user perceives the animation
    const t = setTimeout(() => {
      setCompleted(true);
      setPosition(maxPosition);
      setTimeout(() => onComplete(), 600);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoComplete]);

  return (
    <div ref={containerRef} className="relative h-14 bg-stone-100 border border-stone-300 select-none overflow-hidden" style={{ touchAction: "none" }}>
      <div className="absolute inset-y-0 left-0 bg-gold transition-all" style={{ width: `${position + 56}px`, transitionDuration: isDragging ? "0ms" : "300ms" }}></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`font-body font-bold text-sm uppercase tracking-widest transition-opacity ${completed ? "text-ink" : "text-stone-500"}`}>
          {completed ? "✓ Completed" : label}
        </span>
      </div>
      <div
        className={`absolute top-1 bottom-1 w-14 bg-ink flex items-center justify-center cursor-grab active:cursor-grabbing ${isDragging ? "" : "transition-all duration-300"}`}
        style={{ left: `${position + 4}px` }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          {completed ? (
            <path d="M5 10L9 14L15 6" stroke="#B69A5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <path d="M8 6L13 10L8 14" stroke="#B69A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 6L10 10L5 14" stroke="#B69A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const [mode, setMode] = useState<"type" | "draw">("type");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typedCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Draw mode state ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // --- Type mode state ---
  const [typedName, setTypedName] = useState("");

  // ----- Draw mode -----
  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0A0908";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setHasSigned(true);
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSigned) onChange(canvas.toDataURL("image/png"));
  }

  function clearDraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    onChange("");
  }

  // ----- Type mode: render cursive name to hidden canvas, export as PNG -----
  useEffect(() => {
    if (mode !== "type") return;
    const c = typedCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, c.width, c.height);

    if (!typedName.trim()) {
      onChange("");
      return;
    }

    // Resolve the actual font-family string from the CSS variable
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:absolute;visibility:hidden;font-family:var(--font-signature),cursive";
    document.body.appendChild(probe);
    const fontFamily = getComputedStyle(probe).fontFamily || "cursive";
    document.body.removeChild(probe);

    const render = () => {
      const cc = typedCanvasRef.current;
      if (!cc) return;
      const cx = cc.getContext("2d");
      if (!cx) return;
      cx.clearRect(0, 0, cc.width, cc.height);
      cx.fillStyle = "#0A0908";
      cx.textAlign = "center";
      cx.textBaseline = "middle";
      // Auto-shrink font size if name overflows
      let size = 96;
      do {
        cx.font = `italic 600 ${size}px ${fontFamily}`;
        const w = cx.measureText(typedName).width;
        if (w <= cc.width - 60) break;
        size -= 4;
      } while (size > 32);
      cx.fillText(typedName, cc.width / 2, cc.height / 2 + size * 0.1);
      onChange(cc.toDataURL("image/png"));
    };

    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(render);
    } else {
      render();
    }
  }, [typedName, mode, onChange]);

  function switchMode(newMode: "type" | "draw") {
    if (newMode === mode) return;
    onChange("");
    setHasSigned(false);
    setTypedName("");
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setMode(newMode);
  }

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex gap-0 mb-0" role="tablist" aria-label="Signature input method">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "type"}
          onClick={() => switchMode("type")}
          className={`px-4 py-2 text-xs uppercase tracking-wider font-body border-2 border-b-0 transition-colors ${
            mode === "type"
              ? "bg-white border-stone-300 text-ink"
              : "bg-stone-100 border-transparent text-stone-500 hover:text-ink"
          }`}
        >
          Type
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "draw"}
          onClick={() => switchMode("draw")}
          className={`px-4 py-2 text-xs uppercase tracking-wider font-body border-2 border-b-0 transition-colors ${
            mode === "draw"
              ? "bg-white border-stone-300 text-ink"
              : "bg-stone-100 border-transparent text-stone-500 hover:text-ink"
          }`}
        >
          Draw
        </button>
      </div>

      {mode === "draw" ? (
        <>
          <div className="border-2 border-stone-300 bg-white">
            <canvas
              ref={canvasRef}
              width={800}
              height={180}
              className="w-full h-[180px] cursor-crosshair"
              style={{ touchAction: "none" }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="font-body text-xs text-stone-500 italic">
              {hasSigned ? "Signed ✓" : "Sign with your mouse or finger above"}
            </p>
            <button
              type="button"
              onClick={clearDraw}
              className="text-xs uppercase tracking-wider text-stone-500 hover:text-ink font-body"
            >
              Clear
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="border-2 border-stone-300 bg-white">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full name"
              className="w-full h-[180px] bg-transparent text-center text-5xl text-ink font-signature italic outline-none px-4 placeholder:text-stone-300 placeholder:not-italic placeholder:font-body placeholder:text-base"
              style={{ caretColor: "#B69A5A" }}
              maxLength={60}
              aria-label="Type your signature"
            />
            {/* Hidden canvas: renders the typed name as a PNG for backend storage */}
            <canvas
              ref={typedCanvasRef}
              width={800}
              height={180}
              className="hidden"
              aria-hidden="true"
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="font-body text-xs text-stone-500 italic">
              {typedName.trim()
                ? "Signed ✓ — your typed name is your legal signature"
                : "Type your name above to create a signature"}
            </p>
            <button
              type="button"
              onClick={() => setTypedName("")}
              className="text-xs uppercase tracking-wider text-stone-500 hover:text-ink font-body"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const BUSINESS_TYPES = [
  "General Contracting",
  "Landscaping Design",
  "Concrete Repair/Restoration",
  "Deck Building",
  "Railing Manufacturing",
  "Aluminum Railing Manufacturing",
  "Railing Installation",
  "Other",
];

function CustomerForm({
  initiallySubmitted,
  onSubmitted,
}: {
  initiallySubmitted: boolean;
  onSubmitted: (token: string | null) => void;
}) {
  const [submitted, setSubmitted] = useState(initiallySubmitted);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
    yearsInBusiness: "",
    website: "",
    registeredBusinessNumber: "",
    contractorLicenseNumber: "",
    regionsSoldTo: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    engineerRelationship: "" as "" | "yes" | "no",
    notes: "",
    signatureName: "",
    signatureTitle: "",
  });
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [signature, setSignature] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setData({ ...data, [e.target.name]: e.target.value });
  }

  function toggleBusinessType(type: string) {
    setBusinessTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (businessTypes.length === 0) { setError("Please select at least one Type of Business."); return; }
    if (!data.engineerRelationship) { setError("Please answer the engineer relationship question."); return; }
    if (!signature) { setError("Please sign the form before submitting."); return; }
    if (!data.signatureName.trim()) { setError("Please type your name to sign."); return; }

    setSubmitting(true);

    const { data: token, error: rpcError } = await supabase.rpc("create_pending_dealer", {
      p_company_name: data.companyName.trim(),
      p_contact_name: data.contactName.trim(),
      p_email: data.email.trim(),
      p_phone: data.phone.trim(),
      p_street_address: data.streetAddress.trim() || null,
      p_city: data.city.trim() || null,
      p_province: data.province.trim() || null,
      p_postal_code: data.postalCode.trim() || null,
      // isFinite guard — parseInt("abc") returns NaN and Supabase will reject
      // the whole RPC with a confusing type error. Treat unparseable input
      // as null so the form submission still succeeds.
      p_years_in_business: (() => {
        if (!data.yearsInBusiness) return null;
        const n = parseInt(data.yearsInBusiness, 10);
        return Number.isFinite(n) ? n : null;
      })(),
      p_website: data.website.trim() || null,
      p_notes: data.notes.trim() || null,
      p_type_of_business: businessTypes,
      p_owner_name: data.ownerName.trim() || null,
      p_owner_email: data.ownerEmail.trim() || null,
      p_owner_phone: data.ownerPhone.trim() || null,
      p_engineer_relationship: data.engineerRelationship === "yes",
      p_newsletter_opt_in: newsletterOptIn,
      p_signature_data: signature,
      p_signature_name: data.signatureName.trim(),
      p_signature_title: data.signatureTitle.trim() || null,
      p_registered_business_number: data.registeredBusinessNumber.trim() || null,
      p_contractor_license_number: data.contractorLicenseNumber.trim() || null,
      p_regions_sold_to: data.regionsSoldTo.trim() || null,
    });

    if (rpcError || !token) {
      setError(rpcError?.message ?? "Couldn't submit. Please try again.");
      setSubmitting(false);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify({
        contactName: data.contactName.trim(),
        email: data.email.trim(),
      }));
      localStorage.setItem(GUEST_FORM_KEY, "true");
      localStorage.setItem(REGISTRATION_TOKEN_KEY, token);
    }

    setSubmitting(false);
    setSubmitted(true);
    onSubmitted(token);
  }

  if (submitted) {
    return (
      <div className="bg-white border border-stone-200">
        <div className="p-6 bg-cream-dark border-l-4 border-gold">
          <div className="flex items-start gap-3">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="10" fill="#B69A5A" />
              <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="font-body font-semibold mb-1">Submitted to IAS</p>
              <p className="font-body text-sm text-stone-600">Slide the bar below to complete this module and create your account.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200">
      <div className="p-6 border-b border-stone-200">
        <h3 className="font-heading text-lg font-bold mb-1">New Customer Information</h3>
        <p className="font-body text-sm text-stone-600">Tell us about your business so we can set up your account properly.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Required Section */}
        <div className="space-y-4">
          <p className="eyebrow text-stone-500">Business Information</p>

          <div>
            <label className="eyebrow text-stone-600 block mb-1">Company / Legal Business Name *</label>
            <input name="companyName" type="text" required value={data.companyName} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>

          <div>
            <label className="eyebrow text-stone-600 block mb-1">Primary Contact Person *</label>
            <input name="contactName" type="text" required value={data.contactName} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Email *</label>
              <input name="email" type="email" required value={data.email} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Phone *</label>
              <input name="phone" type="tel" required value={data.phone} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          <div>
            <label className="eyebrow text-stone-600 block mb-1">Street Address *</label>
            <input name="streetAddress" type="text" required value={data.streetAddress} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">City *</label>
              <input name="city" type="text" required value={data.city} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Province / State *</label>
              <input name="province" type="text" required value={data.province} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Postal Code *</label>
              <input name="postalCode" type="text" required value={data.postalCode} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          {/* Type of Business — required */}
          <div>
            <p className="eyebrow text-stone-600 mb-2">Type of Business * (select all that apply)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((type) => (
                <label key={type} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${businessTypes.includes(type) ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
                  <input type="checkbox" checked={businessTypes.includes(type)} onChange={() => toggleBusinessType(type)} className="flex-shrink-0" />
                  <span className="font-body text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Engineer Relationship — required */}
          <div>
            <p className="eyebrow text-stone-600 mb-2">Do you have a working relationship with a qualified engineer? *</p>
            <p className="font-body text-xs text-stone-500 mb-2">Required for code-compliant railing engineering specs in many provinces.</p>
            <div className="flex gap-2">
              <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors flex-1 ${data.engineerRelationship === "yes" ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
                <input type="radio" name="engineerRelationship" value="yes" checked={data.engineerRelationship === "yes"} onChange={handleChange} />
                <span className="font-body font-semibold text-sm">Yes</span>
              </label>
              <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors flex-1 ${data.engineerRelationship === "no" ? "border-gold bg-gold/5" : "border-stone-200 bg-white hover:border-stone-400"}`}>
                <input type="radio" name="engineerRelationship" value="no" checked={data.engineerRelationship === "no"} onChange={handleChange} />
                <span className="font-body font-semibold text-sm">No</span>
              </label>
            </div>
          </div>
        </div>

        {/* Optional details */}
        <div className="space-y-4 pt-4 border-t border-stone-200">
          <p className="eyebrow text-stone-500">Additional Details</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Years in Business</label>
              <input name="yearsInBusiness" type="number" value={data.yearsInBusiness} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Website</label>
              <input name="website" type="url" value={data.website} onChange={handleChange} placeholder="https://" className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Registered Business Number</label>
              <input name="registeredBusinessNumber" type="text" value={data.registeredBusinessNumber} onChange={handleChange} placeholder="GST/HST or equivalent" className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Contractor License Number</label>
              <input name="contractorLicenseNumber" type="text" value={data.contractorLicenseNumber} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          <div>
            <label className="eyebrow text-stone-600 block mb-1">Geographical Regions You Sell To</label>
            <input name="regionsSoldTo" type="text" value={data.regionsSoldTo} onChange={handleChange} placeholder="e.g., Lower Mainland, Vancouver Island, Okanagan" className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>
        </div>

        {/* Owner */}
        <div className="space-y-4 pt-4 border-t border-stone-200">
          <p className="eyebrow text-stone-500">Owner Information</p>
          <div>
            <label className="eyebrow text-stone-600 block mb-1">Owner&apos;s Name</label>
            <input name="ownerName" type="text" value={data.ownerName} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Owner&apos;s Email</label>
              <input name="ownerEmail" type="email" value={data.ownerEmail} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Owner&apos;s Cell</label>
              <input name="ownerPhone" type="tel" value={data.ownerPhone} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="pt-4 border-t border-stone-200">
          <label className="eyebrow text-stone-600 block mb-1">Additional Notes</label>
          <textarea name="notes" value={data.notes} onChange={handleChange} rows={3} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
        </div>

        {/* Signature */}
        <div className="pt-4 border-t border-stone-200 space-y-4">
          <p className="eyebrow text-stone-600">Authorized Signature *</p>
          <SignaturePad onChange={setSignature} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Name (Please Print) *</label>
              <input name="signatureName" type="text" required value={data.signatureName} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
            <div>
              <label className="eyebrow text-stone-600 block mb-1">Title</label>
              <input name="signatureTitle" type="text" value={data.signatureTitle} onChange={handleChange} className="w-full border border-stone-300 px-3 py-2 font-body bg-white" />
            </div>
          </div>

          <p className="font-body text-xs text-stone-500">Date: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

          {/* Newsletter Opt-in — moved here, optional */}
          <div className="bg-cream-dark p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} className="mt-1 flex-shrink-0" />
              <p className="font-body text-sm text-ink leading-relaxed">
                <span className="font-semibold">I acknowledge</span> that I&apos;ll be added to Innovative Aluminum Systems and OnDeck Vinyl Works newsletters for important pricing and product updates. <span className="text-stone-600 italic">Your contact will not be sold.</span>
              </p>
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 font-body">{error}</p>}

        <div className="pt-4 border-t border-stone-200">
          <button type="submit" disabled={submitting} className="btn-gold w-full md:w-auto px-8">
            {submitting ? "Submitting..." : "Submit to IAS"}
          </button>
          <p className="font-body text-xs text-stone-500 mt-2">
            By submitting, you confirm the information above is accurate. Your form will be reviewed within 1 business day.
          </p>
        </div>
      </form>
    </div>
  );
}

function Quiz({
  questions,
  passThresholdPct,
  alreadyPassed,
  onPass,
}: {
  questions: QuizQuestion[];
  passThresholdPct: number;
  alreadyPassed: boolean;
  onPass: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function setAnswer(qid: string, label: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: label }));
  }

  const total = questions.length;
  const correctCount = questions.reduce(
    (acc, q) => acc + (answers[q.id] === q.correctLabel ? 1 : 0),
    0
  );
  const scorePct = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  const passed = scorePct >= passThresholdPct;
  const allAnswered = questions.every((q) => answers[q.id]);

  function handleSubmit() {
    if (!allAnswered) return;
    setSubmitted(true);
    const newCorrect = questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.correctLabel ? 1 : 0),
      0
    );
    const newPct = total === 0 ? 0 : Math.round((newCorrect / total) * 100);
    if (newPct >= passThresholdPct) {
      // small delay so the success state can render before the slide auto-completes
      setTimeout(() => onPass(), 200);
    }
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
    const el = document.getElementById("quiz-top");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Group consecutive questions by category for rendering category headers.
  const groups: { category: string | null; items: QuizQuestion[] }[] = [];
  for (const q of questions) {
    const cat = q.category ?? null;
    const last = groups[groups.length - 1];
    if (last && last.category === cat) {
      last.items.push(q);
    } else {
      groups.push({ category: cat, items: [q] });
    }
  }

  let questionIndex = 0;

  return (
    <div id="quiz-top" className="bg-white border border-stone-200">
      <div className="p-6 bg-cream-dark border-l-4 border-gold">
        <p className="eyebrow text-gold mb-1">Open-Book Quiz</p>
        <p className="font-body text-sm text-stone-700 leading-relaxed">
          Refer to the reference documents at any time — they stay pinned on the right while you take the quiz.
          Pass with <span className="font-semibold">{passThresholdPct}%</span> or higher to complete this module.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-6">
            {group.category && (
              <div className="border-b border-stone-200 pb-2">
                <p className="eyebrow text-stone-500">Section</p>
                <h3 className="font-heading text-xl font-bold">{group.category}</h3>
              </div>
            )}

            {group.items.map((q) => {
              questionIndex += 1;
              const selected = answers[q.id];
              const isCorrect = submitted && selected === q.correctLabel;
              const isWrong = submitted && selected && selected !== q.correctLabel;

              return (
                <div key={q.id} className="space-y-3">
                  <p className="font-body font-semibold text-ink leading-relaxed">
                    <span className="text-stone-400 mr-2">{questionIndex}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = selected === opt.label;
                      const isThisCorrect = submitted && opt.label === q.correctLabel;
                      const isThisWrongSelected = submitted && isSelected && !isCorrect;

                      let classes =
                        "flex items-start gap-3 p-3 border cursor-pointer transition-colors ";
                      if (submitted) {
                        if (isThisCorrect) {
                          classes += "border-green-600 bg-green-50";
                        } else if (isThisWrongSelected) {
                          classes += "border-red-600 bg-red-50";
                        } else {
                          classes += "border-stone-200 bg-stone-50 opacity-70";
                        }
                        classes += " cursor-default";
                      } else if (isSelected) {
                        classes += "border-gold bg-gold/5";
                      } else {
                        classes += "border-stone-200 bg-white hover:border-stone-400";
                      }

                      return (
                        <label key={opt.label} className={classes}>
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.label}
                            checked={isSelected}
                            disabled={submitted}
                            onChange={() => setAnswer(q.id, opt.label)}
                            className="mt-1 flex-shrink-0"
                          />
                          <span className="font-body text-sm flex-1">
                            <span className="font-semibold text-stone-500 mr-2">{opt.label}.</span>
                            {opt.text}
                          </span>
                          {submitted && isThisCorrect && (
                            <span className="text-xs font-body font-bold text-green-700 uppercase tracking-wider flex-shrink-0">Correct</span>
                          )}
                          {submitted && isThisWrongSelected && (
                            <span className="text-xs font-body font-bold text-red-700 uppercase tracking-wider flex-shrink-0">Your answer</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {isWrong && (
                    <p className="text-xs font-body text-red-700 italic">
                      The correct answer is {q.correctLabel}.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-stone-200 bg-cream-dark">
        {!submitted ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="font-body text-sm text-stone-600">
              <span className="font-semibold text-ink">
                {Object.keys(answers).length}
              </span>{" "}
              / {total} answered
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answers
            </button>
          </div>
        ) : passed ? (
          <div className="flex items-start gap-3">
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="10" fill="#15803d" />
              <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="font-heading text-lg font-bold text-green-800 mb-1">
                Passed — {correctCount} / {total} correct ({scorePct}%)
              </p>
              <p className="font-body text-sm text-stone-700">
                {alreadyPassed
                  ? "Module already completed. Nice work."
                  : "Module unlocked. Slide to complete below."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <svg width="28" height="28" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="10" cy="10" r="10" fill="#b91c1c" />
                <path d="M7 7L13 13M13 7L7 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div>
                <p className="font-heading text-lg font-bold text-red-800 mb-1">
                  {correctCount} / {total} correct ({scorePct}%) — need {passThresholdPct}% to pass
                </p>
                <p className="font-body text-sm text-stone-700">
                  Review the highlighted answers, check the reference documents, and try again.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="btn-outline-dark flex-shrink-0"
            >
              Retry Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarReferenceList({ docs }: { docs: ReferenceDoc[] }) {
  return (
    <div className="bg-white border border-stone-200">
      <div className="px-5 py-4 border-b border-stone-200 bg-cream-dark">
        <p className="eyebrow text-gold mb-1">Reference Documents</p>
        <p className="font-body text-xs text-stone-600">
          Open-book — refer to these while taking the quiz.
        </p>
      </div>
      <div className="max-h-[60vh] overflow-y-auto divide-y divide-stone-100">
        {docs.map((doc) => (
          <div key={doc.name} className="p-4">
            <p className="eyebrow text-stone-400 mb-1">PDF</p>
            <p className="font-body text-sm font-semibold mb-1 leading-snug">{doc.name}</p>
            <p className="font-body text-xs text-stone-500 mb-3 leading-snug">{doc.description}</p>
            <div className="flex gap-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs font-body font-bold uppercase tracking-wider px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-cream transition-colors"
              >
                View
              </a>
              <a
                href={doc.url}
                download
                className="flex-1 text-center text-xs font-body font-bold uppercase tracking-wider px-3 py-1.5 bg-gold text-ink hover:bg-gold-hover transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferenceDocCard({ doc }: { doc: ReferenceDoc }) {
  return (
    <div className="block p-5 bg-white border border-stone-200 hover:border-gold transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="eyebrow text-stone-400 mb-2">PDF</p>
          <h4 className="font-heading text-base font-bold mb-1">{doc.name}</h4>
          <p className="font-body text-xs text-stone-600">{doc.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <a href={doc.url} download className="btn-gold text-xs px-4 py-2 flex-1 text-center">Download</a>
        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-outline-dark text-xs px-4 py-2 flex-1 text-center">View</a>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string>(MODULES[0].id);
  const [loading, setLoading] = useState(true);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [justSubmittedForm, setJustSubmittedForm] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [lockedClickFeedback, setLockedClickFeedback] = useState<string | null>(null);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [quizPassed, setQuizPassed] = useState<Record<string, boolean>>({});
  const [justPassedQuiz, setJustPassedQuiz] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsGuest(true);
        const stored = typeof window !== "undefined" ? localStorage.getItem(GUEST_PROGRESS_KEY) : null;
        const guestCompleted = stored ? JSON.parse(stored) : [];
        setCompleted(guestCompleted);
        const formStored = typeof window !== "undefined" ? localStorage.getItem(GUEST_FORM_KEY) : null;
        setFormSubmitted(formStored === "true");
        const tokenStored = typeof window !== "undefined" ? localStorage.getItem(REGISTRATION_TOKEN_KEY) : null;
        if (tokenStored) setRegistrationToken(tokenStored);
        const firstAvailable = MODULES.find((m, idx) => {
          if (guestCompleted.includes(m.id)) return false;
          if (idx === 0) return true;
          if (!guestCompleted.includes(MODULES[idx - 1].id)) return false;
          if (idx >= 2) return false;
          return true;
        });
        if (firstAvailable) setActiveId(firstAvailable.id);
        else if (guestCompleted.includes("dealer-setup")) setActiveId("dealer-setup");
        setLoading(false);
        return;
      }

      setIsGuest(false);

      const { data: progress } = await supabase
        .from("training_progress")
        .select("module_id")
        .eq("user_id", user.id);
      const completedIds = (progress || []).map((p) => p.module_id);
      setCompleted(completedIds);
      const firstIncomplete = MODULES.find((m) => !completedIds.includes(m.id));
      if (firstIncomplete) setActiveId(firstIncomplete.id);

      setFormSubmitted(true);

      setLoading(false);
    }
    loadProgress();
  }, [router]);

  function isModuleUnlocked(moduleId: string): boolean {
    const idx = MODULES.findIndex((m) => m.id === moduleId);
    if (idx === 0) return true;
    const previousId = MODULES[idx - 1].id;
    if (!completed.includes(previousId)) return false;
    if (isGuest && idx >= 2) return false;
    return true;
  }

  function handleModuleClick(moduleId: string) {
    if (!isModuleUnlocked(moduleId)) {
      setLockedClickFeedback(moduleId);
      setTimeout(() => setLockedClickFeedback(null), 1500);
      return;
    }
    setActiveId(moduleId);
  }

  async function markComplete(id: string) {
    if (completed.includes(id)) return;

    if (isGuest) {
      const newCompleted = [...completed, id];
      setCompleted(newCompleted);
      localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(newCompleted));
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("training_progress")
        .insert({ user_id: user.id, module_id: id });
      if (error) {
        alert("Couldn't save your progress. Try again.");
        return;
      }
      setCompleted([...completed, id]);
    }

    setJustCompleted(id);
    setTimeout(() => {
      setJustCompleted(null);

      if (id === "dealer-setup" && isGuest && registrationToken) {
        setShowAccountPopup(true);
        return;
      }

      const currentIdx = MODULES.findIndex((m) => m.id === id);
      const next = MODULES[currentIdx + 1];
      if (next && !(isGuest && currentIdx + 1 >= 2)) {
        setActiveId(next.id);
        const el = document.getElementById("active-module");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 2000);
  }

  function handleFormSubmitted(token: string | null) {
    setFormSubmitted(true);
    setJustSubmittedForm(true);
    if (token) setRegistrationToken(token);
  }

  if (loading) {
    return <div className="section-container section-padding"><p className="text-stone-600">Loading...</p></div>;
  }

  const activeModule = MODULES.find((m) => m.id === activeId) || MODULES[0];
  const completedCount = completed.length;
  const totalCount = MODULES.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const isAuthorized = !isGuest && completedCount === totalCount;

  const canCompleteActive =
    activeModule.type === "form"
      ? formSubmitted
      : activeModule.type === "quiz"
      ? quizPassed[activeModule.id] === true || completed.includes(activeModule.id)
      : true;

  return (
    <div className="bg-cream">
      {justCompleted && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-gold text-ink px-12 py-8 shadow-2xl animate-pulse">
            <p className="eyebrow mb-2">Module Complete</p>
            <p className="font-heading text-3xl font-bold">Great work.</p>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-cream border-b border-stone-200">
        <div className="section-container py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-body text-stone-600 hover:text-ink transition-colors">← Dashboard</Link>
              <span className="text-stone-300">/</span>
              <p className="eyebrow text-stone-600">Onboarding</p>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-sm font-body">
                <span className="font-bold text-ink">{completedCount}</span>
                <span className="text-stone-400"> / {totalCount} complete</span>
              </p>
              {isAuthorized && (
                <span className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-1.5 text-xs font-body font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-gold"></span>
                  Authorized
                </span>
              )}
            </div>
          </div>
          <div className="w-full bg-stone-200 h-1 overflow-hidden">
            <div className="h-full bg-gold transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="section-container pt-16 pb-12">
        <p className="eyebrow text-gold mb-4">Authorized Dealer Program</p>
        <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4 max-w-3xl">
          {isAuthorized ? "You're authorized." : "Become an authorized dealer."}
        </h1>
        <p className="font-body text-lg text-stone-600 max-w-2xl">
          {isAuthorized
            ? "All onboarding modules complete. You now have full access to the IAS dealer network."
            : isGuest
            ? "Walk through Modules 1 and 2 to learn about IAS and submit your business info. After that you'll create your account to unlock the rest."
            : "Complete each module in order to unlock your authorized dealer status, premium pricing, and lead distribution."}
        </p>
      </div>

      <div className="section-container mb-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {MODULES.map((mod, idx) => {
            const isComplete = completed.includes(mod.id);
            const isActive = mod.id === activeId;
            const isUnlocked = isModuleUnlocked(mod.id);
            const isJiggling = lockedClickFeedback === mod.id;
            const lockedReason =
              isGuest && idx >= 2 && completed.includes("dealer-setup")
                ? "Create your account to continue"
                : "Complete previous module first";

            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod.id)}
                disabled={!isUnlocked}
                className={`text-left p-5 border transition-all relative ${isJiggling ? "animate-pulse" : ""} ${
                  !isUnlocked
                    ? "border-stone-200 bg-stone-50 cursor-not-allowed opacity-60"
                    : isActive
                    ? "border-gold bg-white"
                    : isComplete
                    ? "border-stone-300 bg-cream-dark"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-heading text-2xl font-bold ${
                    !isUnlocked ? "text-stone-300" : isActive ? "text-gold" : isComplete ? "text-stone-400" : "text-stone-300"
                  }`}>
                    0{idx + 1}
                  </span>
                  {isComplete && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                      <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {!isUnlocked && !isComplete && (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-stone-400">
                      <rect x="5" y="9" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 9V6.5C7 4.84 8.34 3.5 10 3.5C11.66 3.5 13 4.84 13 6.5V9" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </div>
                <p className={`font-body text-sm font-semibold mb-1 ${
                  !isUnlocked ? "text-stone-400" : isComplete ? "text-stone-500" : "text-ink"
                }`}>
                  {mod.title}
                </p>
                <p className="text-xs text-stone-400">{mod.duration}</p>
                {isJiggling && (
                  <p className="absolute -bottom-7 left-0 right-0 text-xs text-center text-stone-500 font-body italic">{lockedReason}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div id="active-module" className="section-container pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <p className="eyebrow text-gold mb-3">Module {MODULES.findIndex((m) => m.id === activeModule.id) + 1} of {totalCount}</p>
            <h2 className="font-heading text-4xl font-bold mb-4">{activeModule.title}</h2>
            <p className="font-body text-stone-600 mb-8">{activeModule.description}</p>

            {activeModule.type === "video" && activeModule.videoId && (
              <div className="aspect-video bg-ink mb-8 overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${activeModule.videoId}`}
                  title={activeModule.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {activeModule.type === "form" && (
              <div className="mb-8">
                <CustomerForm
                  initiallySubmitted={formSubmitted}
                  onSubmitted={handleFormSubmitted}
                />
              </div>
            )}

            {activeModule.type === "quiz" && activeModule.questions && (
              <div className="mb-8">
                <Quiz
                  key={activeModule.id}
                  questions={activeModule.questions}
                  passThresholdPct={activeModule.passThresholdPct ?? 80}
                  alreadyPassed={completed.includes(activeModule.id)}
                  onPass={() => {
                    if (!quizPassed[activeModule.id]) {
                      setQuizPassed((prev) => ({ ...prev, [activeModule.id]: true }));
                      setJustPassedQuiz(activeModule.id);
                    }
                  }}
                />
              </div>
            )}

            {/* Reference documents render in the main column ONLY for non-quiz modules.
                For quiz modules they live in the sticky sidebar so the dealer can
                consult them while answering. */}
            {activeModule.type !== "quiz" && activeModule.references && activeModule.references.length > 0 && (
              <div className="mb-8">
                <div className="flex items-baseline justify-between mb-5">
                  <h3 className="font-heading text-xl font-bold">Reference Documents</h3>
                  <p className="text-xs font-body text-stone-500 uppercase tracking-wider">{activeModule.references.length} Files</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeModule.references.map((ref) => (
                    <ReferenceDocCard key={ref.name} doc={ref} />
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-md">
              {completed.includes(activeModule.id) ? (
                <div className="flex items-center gap-3 text-stone-600">
                  <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                    <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-body font-semibold">Module complete</span>
                </div>
              ) : canCompleteActive ? (
                <SlideToComplete
                  onComplete={() => {
                    markComplete(activeModule.id);
                    setJustSubmittedForm(false);
                    setJustPassedQuiz(null);
                  }}
                  autoComplete={
                    (activeModule.type === "form" && justSubmittedForm) ||
                    (activeModule.type === "quiz" && justPassedQuiz === activeModule.id)
                  }
                />
              ) : (
                <div className="bg-stone-100 border border-stone-300 h-14 flex items-center justify-center">
                  <span className="font-body text-sm text-stone-400 uppercase tracking-widest">
                    {activeModule.type === "form"
                      ? "Submit the form to unlock"
                      : activeModule.type === "quiz"
                      ? "Pass the quiz to unlock"
                      : "Complete the module to unlock"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {activeModule.type === "quiz" && activeModule.references && activeModule.references.length > 0 && (
                <SidebarReferenceList docs={activeModule.references} />
              )}
              <div className="bg-ink text-cream p-8">
              <p className="eyebrow text-gold mb-4">Your Status</p>
              <p className="font-heading text-3xl font-bold mb-6">
                {isAuthorized ? "Authorized Dealer" : isGuest ? "Guest" : "In Onboarding"}
              </p>
              <div className="space-y-3 mb-8">
                {MODULES.map((mod) => {
                  const isComplete = completed.includes(mod.id);
                  const unlocked = isModuleUnlocked(mod.id);
                  return (
                    <div key={mod.id} className="flex items-center gap-3 text-sm font-body">
                      {isComplete ? (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                          <circle cx="10" cy="10" r="10" fill="#B69A5A" />
                          <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : unlocked ? (
                        <div className="w-4 h-4 rounded-full border border-stone-400 flex-shrink-0"></div>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 text-stone-500">
                          <rect x="5" y="9" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M7 9V6.5C7 4.84 8.34 3.5 10 3.5C11.66 3.5 13 4.84 13 6.5V9" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      )}
                      <span className={isComplete ? "line-through text-stone-400" : !unlocked ? "text-stone-500" : ""}>
                        {mod.title}
                      </span>
                    </div>
                  );
                })}
              </div>
              {isGuest && (
                <div className="border-t border-stone-700 pt-6">
                  <p className="font-body text-sm text-cream/70 mb-3 leading-relaxed">
                    Modules 3 through 5 require an account. After you submit the customer form in Module 2, you&apos;ll be able to create your login.
                  </p>
                  {formSubmitted && registrationToken && (
                    <Link
                      href={`/register/${registrationToken}`}
                      className="btn-gold text-xs px-5 py-2.5 inline-block"
                    >
                      Create my account →
                    </Link>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAccountPopup && registrationToken && (
        <div className="fixed inset-0 z-[60] bg-ink/80 flex items-center justify-center p-4">
          <div className="bg-cream max-w-md w-full p-8 shadow-2xl">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="36" height="36" viewBox="0 0 20 20" fill="none">
                <path d="M5 10L9 14L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="eyebrow text-gold mb-2 text-center">Modules 1 &amp; 2 Complete</p>
            <h2 className="font-heading text-3xl font-bold mb-3 text-center">Time to create your account.</h2>
            <p className="font-body text-sm text-stone-600 mb-6 text-center leading-relaxed">
              You&apos;re ready to continue. Create your dealer login to unlock Modules 3, 4, and 5 and join the IAS dealer network.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/register/${registrationToken}`}
                className="btn-gold text-center"
              >
                Create my account →
              </Link>
              <button
                onClick={() => setShowAccountPopup(false)}
                className="text-xs font-body uppercase tracking-wider text-stone-500 hover:text-ink transition-colors py-2"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

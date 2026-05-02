"use client";

import { BookOpen, CheckCircle2, Lightbulb, ShieldCheck } from "lucide-react";
import { ContentThesis, TheoryCard } from "@/lib/types";

interface TheoryLabPanelProps {
  selectedTheory: TheoryCard;
  theories: TheoryCard[];
  thesis: ContentThesis;
  onSelect: (theoryId: string) => void;
}

export function TheoryLabPanel({ onSelect, selectedTheory, theories, thesis }: TheoryLabPanelProps) {
  return (
    <section className="work-panel theory-lab">
      <div className="section-heading">
        <div>
          <span className="kicker">03 理论确认</span>
          <h2>把热点变成一个可解释的论点</h2>
        </div>
        <ShieldCheck size={20} />
      </div>
      <div className="theory-layout">
        <div className="theory-options">
          {theories.map((theory) => (
            <button className={`theory-card ${theory.id === selectedTheory.id ? "selected" : ""}`} key={theory.id} onClick={() => onSelect(theory.id)} type="button">
              <div>
                <h3>{theory.name}</h3>
                <span>{theory.explanatoryPower}</span>
              </div>
              <p>{theory.oneSentence}</p>
              <small>{theory.angle}</small>
            </button>
          ))}
        </div>
        <div className="thesis-board">
          <h3>
            <Lightbulb size={18} />
            今日论点
          </h3>
          <p className="claim">{thesis.coreClaim}</p>
          <div className="thesis-grid">
            <div>
              <b>反对误读</b>
              <p>{thesis.antiMisreading}</p>
            </div>
            <div>
              <b>带走一句话</b>
              <p>{thesis.goldenLine}</p>
            </div>
          </div>
          <div className="theory-notes">
            <NoteList icon={<CheckCircle2 size={15} />} title="常见误读" items={selectedTheory.misreadings} />
            <NoteList icon={<BookOpen size={15} />} title="参考来源" items={selectedTheory.sourceRefs} />
          </div>
        </div>
      </div>
    </section>
  );
}

function NoteList({ icon, items, title }: { icon: React.ReactNode; items: string[]; title: string }) {
  return (
    <div>
      <h4>
        {icon}
        {title}
      </h4>
      {items.slice(0, 2).map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

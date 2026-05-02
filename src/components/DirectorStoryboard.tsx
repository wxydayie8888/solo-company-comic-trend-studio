import { Clapperboard, Image as ImageIcon, Volume2 } from "lucide-react";
import { Episode } from "@/lib/types";

export function DirectorStoryboard({ episode }: { episode: Episode }) {
  return (
    <section className="work-panel director-board">
      <div className="section-heading">
        <div>
          <span className="kicker">05 分镜审片</span>
          <h2>像导演一样检查画面、字幕和声音</h2>
        </div>
        <Clapperboard size={20} />
      </div>
      <div className="identity-strip">
        <p><b>主角</b>{episode.visualIdentity.mainCharacter}</p>
        <p><b>画风</b>{episode.visualIdentity.lineStyle}</p>
        <p><b>色彩</b>{episode.visualIdentity.palette}</p>
      </div>
      <div className="cover-grid">
        {episode.coverConcepts.map((cover) => (
          <article className="cover-card" key={cover.id}>
            <div className={`cover-preview cover-${cover.id.toLowerCase()}`}>
              <span>Cover {cover.id}</span>
              <strong>{cover.headline}</strong>
            </div>
            <p>{cover.composition}</p>
            <small>{cover.platformFit}</small>
          </article>
        ))}
      </div>
      <div className="director-grid">
        {episode.storyboard.map((frame) => (
          <article className="frame-card" key={frame.id}>
            <div className={`frame-visual visual-${frame.id}`}>
              <span>{frame.id}</span>
              <strong>{frame.beat}</strong>
            </div>
            <div className="frame-body">
              <h3>{frame.caption}</h3>
              <p>{frame.narration}</p>
              <dl>
                <div>
                  <dt><ImageIcon size={13} /> 镜头</dt>
                  <dd>{frame.camera}</dd>
                </div>
                <div>
                  <dt><Volume2 size={13} /> 声音</dt>
                  <dd>{frame.sound}</dd>
                </div>
              </dl>
              <small>{frame.safeArea} · {frame.duration}s</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

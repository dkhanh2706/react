import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, CircleHelp, FileText, Handshake, Headphones, LockKeyhole, Luggage, Mail, Phone, RotateCcw, ShieldCheck, X } from "lucide-react";
import "../../styles/FooterHelpDialog.css";

const icons = {
  booking: BookOpen,
  refunds: RotateCcw,
  baggage: Luggage,
  security: ShieldCheck,
  faq: CircleHelp,
  terms: FileText,
  privacy: LockKeyhole,
  partners: Handshake,
};

export default function FooterHelpDialog({ topic, onDismiss }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [closing, setClosing] = useState(false);
  const Icon = icons[topic.icon];

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    const timeout = window.setTimeout(() => {
      dialogRef.current.close();
      onDismiss();
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
    return () => window.clearTimeout(timeout);
  }, [closing, onDismiss]);

  const close = () => setClosing(true);
  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll("button:not(:disabled), a[href], summary")]
      .filter((control) => control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  const handleBackdropClick = (event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`footer-help-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <header className="footer-help-header">
        <div className="footer-help-heading">
          <span className="footer-help-icon"><Icon size={24} aria-hidden="true" /></span>
          <div>
            <span className="footer-help-eyebrow">DAMH SHOP · TRUNG TÂM HỖ TRỢ</span>
            <h2 id={titleId}>{topic.title}</h2>
          </div>
        </div>
        <button type="button" className="footer-help-close" onClick={close} aria-label="Đóng cửa sổ hỗ trợ" autoFocus>
          <X size={21} aria-hidden="true" />
        </button>
      </header>

      <div className="footer-help-body">
        <p className="footer-help-intro" id={descriptionId}>{topic.subtitle}</p>
        {topic.steps && <ol className="footer-help-steps">
          {topic.steps.map((step, index) => <li key={step.title}>
            <span className="footer-help-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{step.title}</h3><p>{step.text}</p></div>
          </li>)}
        </ol>}
        {topic.sections && <div className="footer-help-sections">
          {topic.sections.map((section) => <section key={section.title}>
            <h3>{section.title}</h3>
            {section.text && <p>{section.text}</p>}
            {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>)}
        </div>}
        {topic.questions && <div className="footer-help-questions">
          {topic.questions.map((question, index) => <details key={question.title} open={index === 0 ? true : undefined}>
            <summary>{question.title}<span aria-hidden="true" className="footer-help-question-toggle">+</span></summary>
            <p>{question.text}</p>
          </details>)}
        </div>}
        {topic.note && <p className="footer-help-note"><ShieldCheck size={19} aria-hidden="true" /><span>{topic.note}</span></p>}
      </div>

      <div className="footer-help-bottom">
        <div className="footer-help-contact">
          <span className="footer-help-contact-label"><Headphones size={16} aria-hidden="true" /> Cần hỗ trợ thêm?</span>
          <div>
            <a href="tel:0963176945"><Phone size={14} aria-hidden="true" />0963176945</a>
            <a href="mailto:duykhanh1911205@gmail.com"><Mail size={14} aria-hidden="true" />Gửi email</a>
          </div>
        </div>
        <button type="button" className="footer-help-done" onClick={close}>Đã hiểu</button>
      </div>
    </dialog>
  );
}

import { useState } from "react";
import { useProjectStore } from "../../app/store/projectStore";
import {
  DESIGN_STEPS,
  METHOD_LABELS,
  systemLabel,
  validate,
} from "./model/designModel";
import {
  CalculationInputs,
  DesignOverview,
  FinalResult,
  FlowHeader,
  FlowStepper,
  MethodSelect,
  PathSelect,
  ProjectInfo,
  Review,
  SiteConditions,
  SystemConfig,
} from "./components/ProjectWorkspaceSections";

export function ProjectWorkspacePage() {
  const { activeProject, stepIndex, updateForm, updateLoadItem, addLoadItem, removeLoadItem, saveProject, goDashboard, goToStep } = useProjectStore();
  const [started, setStarted] = useState(stepIndex > 0);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const form = activeProject.form;
  const activeIndex = Math.max(0, Math.min(stepIndex, DESIGN_STEPS.length - 1));
  const completedSteps = form.workflowCompletedSteps || [];
  const completedSet = new Set(completedSteps);
  const previousConfirmed = activeIndex === 0 || completedSet.has(activeIndex - 1);
  const currentErrors = validate(form, activeIndex);
  const canConfirm = previousConfirmed && currentErrors.length === 0;
  const headerTitle = !started ? "پروژه جدید" : activeIndex === 2 && form.systemType ? systemLabel(form.systemType) : activeIndex === 3 && form.calculationMode ? METHOD_LABELS[form.calculationMode] : DESIGN_STEPS[activeIndex];

  function markStepDone(index) {
    const nextCompleted = Array.from(new Set([...(form.workflowCompletedSteps || []), index])).sort((a, b) => a - b);
    updateForm({ workflowCompletedSteps: nextCompleted, lastConfirmedStep: index });
  }

  function next() {
    setTouchedConfirm(true);
    const errors = validate(form, activeIndex);
    if (!previousConfirmed) return;
    if (errors.length) return;
    markStepDone(activeIndex);
    saveProject();
    if (activeIndex === 1 && form.scenarioFlowStage === "site-first") {
      updateForm({ scenarioFlowStage: "loads-after-site", calculationMode: "loads" });
      goToStep(4);
      return;
    }
    if (activeIndex === 4 && form.scenarioFlowStage === "loads-after-site") {
      updateForm({ scenarioFlowStage: "done" });
      goToStep(5);
      return;
    }
    if (activeIndex < DESIGN_STEPS.length - 1) { setTouchedConfirm(false); goToStep(activeIndex + 1); }
  }

  function content() {
    if (!started) return <DesignOverview onStart={() => { setStarted(true); goToStep(0); }} />;
    if (activeIndex === 0) return <ProjectInfo form={form} updateForm={updateForm} />;
    if (activeIndex === 1) return <SiteConditions form={form} updateForm={updateForm} />;
    if (activeIndex === 2) return <PathSelect form={form} updateForm={updateForm} />;
    if (activeIndex === 3) return <MethodSelect form={form} updateForm={updateForm} />;
    if (activeIndex === 4) return <CalculationInputs form={form} updateForm={updateForm} updateLoadItem={updateLoadItem} addLoadItem={addLoadItem} removeLoadItem={removeLoadItem} />;
    if (activeIndex === 5) return <SystemConfig form={form} updateForm={updateForm} />;
    if (activeIndex === 6) return <Review form={form} goToStep={goToStep} />;
    return <FinalResult form={form} locked={!previousConfirmed} />;
  }

  const jumpToStep = (index) => { setTouchedConfirm(false); setStarted(true); goToStep(index); };

  const blockingMessages = !previousConfirmed ? ["برای تایید این مرحله، ابتدا مرحله قبل را تکمیل و تایید کنید."] : currentErrors;

  return (
    <main className="project-flow-shell" dir="rtl">
      <FlowHeader title={headerTitle} onDashboard={goDashboard} />
      {!started ? (
        <>
          <section className="mobile-scroll-content no-stepbar project-start-scroll"><DesignOverview onStart={(index = 0) => jumpToStep(index)} /></section>
          <footer className="mobile-fixed-footer unified-shil-footer"><button className="btn btn--ghost" type="button" onClick={goDashboard}>برگشت</button></footer>
        </>
      ) : (
        <div className="focus-layout workspace-fixed-shell">
          <FlowStepper activeIndex={activeIndex} form={form} completedSteps={completedSteps} goToStep={jumpToStep} />
          <section className={`focus-content-card pro-content-card workspace-scroll-frame ${previousConfirmed ? "is-confirmable" : "is-readonly-step"}`}>
            {!previousConfirmed ? <div className="step-lock-banner shil-warning-top">این صفحه قابل مشاهده و تکمیل آزمایشی است؛ اما تایید آن تا تایید مرحله قبل غیرفعال می‌ماند.</div> : null}
            {content()}
            {(touchedConfirm || blockingMessages.length > 0) && !canConfirm && activeIndex < 7 ? <div className="form-error-panel shil-warning-top">{blockingMessages.map((item, index) => <p key={index}>⚠️ {item}</p>)}</div> : null}
          </section>
          {activeIndex < 7 ? (
            <footer className="mobile-fixed-footer unified-shil-footer workspace-action-footer">
              <button className="btn btn--ghost" type="button" onClick={() => activeIndex > 0 ? jumpToStep(activeIndex - 1) : setStarted(false)}>مرحله قبل</button>
              <button className="btn btn--secondary" type="button" onClick={saveProject}>ذخیره پیش‌نویس</button>
              <button className="btn btn--primary" type="button" disabled={!canConfirm} onClick={next}>{activeIndex === 6 ? "تایید و اجرای محاسبات" : "تایید مرحله"}</button>
            </footer>
          ) : null}
        </div>
      )}
    </main>
  );
}

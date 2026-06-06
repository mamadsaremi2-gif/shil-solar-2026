export function runControllerEngine(form) {
  const pvCurrent = form.pv.panelImp * form.pv.parallelCount;
  const recommendedControllerCurrentA = Math.ceil(pvCurrent * 1.25);

  return {
    pvCurrentA: pvCurrent,
    recommendedControllerCurrentA
  };
}

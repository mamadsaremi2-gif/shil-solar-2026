import { createEngineeringForm } from "../../core/engineering/contracts/engineeringForm.contract.js";

export function mapWorkflowStateToEngineeringForm(state) {
  return createEngineeringForm({
    projectInfo: state.projectInfo,
    environment: state.environment,
    projectPath: state.projectPath,
    calculationMethod: state.calculationMethod,
    calculationInputs: state.calculationInputs,
    systemSettings: state.systemSettings,
  });
}

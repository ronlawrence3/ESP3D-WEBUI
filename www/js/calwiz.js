/* wizard */
var currentStep = 0;
var steps = document.getElementsByClassName('calibration-wizard-step');
var calibrationWizardShowing = false;

id('calwiztab').addEventListener('activate', showCalibrationWizard, false);

function showCalibrationWizard(message) {
  if (!message instanceof Event) {
    setHTML('calmessage', message ? message : '');
  }
  setCalStatus();
  calibrationWizardShowing = true;
  if (maslowStatus.homed) {
    currentStep = 3;
  } else {
    currentStep = -1;
  }
  calibrationNextStep(currentStep);
}

function setCalStatus(timeout=0) {
  setTimeout(() => {
    const st = id('systemStatus').innerText;
    setHTML('calStatus', st);
    if (st == 'Alarm') {
      id('calStatus').classList.add('system-status-alarm');
    } else {
      id('calStatus').classList.remove('system-status-alarm');
    }
  }, timeout);
}

function hideCalibrationWizard() {
  calibrationWizardShowing = false;
  hideModal('calibration-wizard-modal');
  if (!maslowStatus.homed) {
    window.location.reload();
    // TODO: another notification here? restart system?
    // showCalibrationWizard('Maslow is still not homed. You may need to reload the browser');
  }
}

function calibrationShowStep(stepIndex) {
  for (var i = 0; i < steps.length; i++) {
    steps[i].style.display = 'none';
  }
  steps[stepIndex].style.display = 'block';
}

function calibrationPreviousStep() {
  if (currentStep > 0) {
    currentStep--;
    calibrationShowStep(currentStep);
  }
}

function calibrationNextStep() {
  if (currentStep < steps.length - 1) {
    currentStep++;
    calibrationShowStep(currentStep);
  } else {
    hideCalibrationWizard();
  }
}

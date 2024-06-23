/* wizard */
var currentStep = 0;
var steps = document.getElementsByClassName('calibration-wizard-step');

id('calwiztab').addEventListener('activate', showCalibrationWizard, false);

function showCalibrationWizard(message) {
  if (!message instanceof Event) {
    setHTML('calmessage', message ? message : '');
  }
  setCalStatus();
  if (maslowStatus.homed) {
    if (
        maslowStatus.tr === 0 ||
        maslowStatus.tl === 0 ||
        maslowStatus.br === 0 ||
        maslowStatus.bl === 0
    ) {
      // extend all
      currentStep = 1;
    } else if (!maslowStatus.extended) {
      //  hang it?
      currentStep = 2;
    } else {
      currentStep = 3;
    }
  } else {
    currentStep = -1;
  }
  calibrationNextStep(currentStep);
}

function setCalStatus(timeout=0) {
  clearAlarm();
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
  sendCommand("$MINFO");
  setTimeout(()=> {
    if (!maslowStatus.homed) {
      window.location.reload(); // will end up back here...
    } else {
      id('tablettablink').click();
    }
  }, 2000);

}

function calibrationShowStep(stepIndex) {
  for (var i = 0; i < steps.length; i++) {
    steps[i].style.display = 'none';
  }
  steps[stepIndex].style.display = 'block';
  id("stepnumber").innerText = stepIndex + 1;
  id("totalsteps").innerText = steps.length;
}

function calibrationPreviousStep() {
  if (currentStep > 0) {
    currentStep--;
    calibrationShowStep(currentStep);
  }
}

function calibrationNextStep() {
  if (currentStep < steps.length - 1) {
    sendCommand("$MINFO");
    currentStep++;
    calibrationShowStep(currentStep);
  } else {
    hideCalibrationWizard();
  }
}

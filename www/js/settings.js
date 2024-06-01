var scl = [] // setting_configList
var setting_error_msg = ''
var setting_lasti = -1
var setting_lastj = -1
var current_setting_filter = 'nvs'
var setup_is_done = false
var do_not_build_settings = false
const CONFIG_TOOLTIPS = {
  Maslow_vertical: "If the maslow is oriented horizontally, set this to false",
  Maslow_calibration_offset_X: "mm offset from the edge of the frame, X",
  Maslow_calibration_offset_Y: "mm offset from the edge of the frame, Y",
  Maslow_calibration_size_X: "Number of X points to use in calibration",
  Maslow_calibration_size_Y: "Number of Y points to use in calibration",
  Maslow_brX: "Bottom right anchor x (normally width in mm)",
  Maslow_brY: "Bottom right anchor y (normally 0)",
  Maslow_brZ: "Bottom right z (normally 117)",
  Maslow_tlX: "Top left anchor x (normally 0)",
  Maslow_tlY: "Top left anchor y (normally height in mm)",
  Maslow_tlZ: "Top left z (normally 144)",
  Maslow_trX: "Top right anchor x (normally width in mm)",
  Maslow_trY: "Top right anchor y (normally height in mm)",
  Maslow_trZ: "Top right z (normally 97)",
  Maslow_blX: "Bottom left anchor x (normally 0)",
  Maslow_blY: "Bottom left anchor y (normally 0)",
  Maslow_blZ: "Bottom left z (normally 75)",
  Maslow_Retract_Current_Threshold: "Sets how hard should Maslow pull on the belts to retract before considering them to be all the way in",
  Maslow_Calibration_Current_Threshold: "Sets how hard should Maslow pull on the belts during the calibration process.",
  Maslow_calibration_extend_top_y: "starting Y for top belts on extend all (-1000 to 1000) default 0",
  Maslow_calibration_extend_bottom_y: "starting Y for bottom belts on extend all (-1000 to 1000) default ",
}

function refreshSettings(hide_setting_list) {
  if (http_communication_locked) {
    id('config_status').innerHTML = translate_text_item('Communication locked by another process, retry later.')
    return
  }
  do_not_build_settings = typeof hide_setting_list == 'undefined' ? false : !hide_setting_list

  displayBlock('settings_loader')
  displayNone('settings_list_content')
  displayNone('settings_status')
  displayNone('settings_refresh_btn')

  scl = []
  var url = '/command?plain=' + encodeURIComponent('[ESP400]')
  SendGetHttp(url, getESPsettingsSuccess, getESPsettingsfailed)
}

function defval(i) {
  return scl[i].defaultvalue
}

function build_select_flag_for_setting_list(i, j) {
  var html = ''
  var flag = (html +=
    "<select class='form-control' id='setting_" +
    i +
    '_' +
    j +
    "' onchange='setting_checkchange(" +
    i +
    ',' +
    j +
    ")' >")
  html += "<option value='1'"
  var tmp = scl[i].defaultvalue
  tmp |= getFlag(i, j)
  if (tmp == defval(i)) html += ' selected '
  html += '>'
  html += translate_text_item('Disable', true)
  html += '</option>\n'
  html += "<option value='0'"
  var tmp = defval(i)
  tmp &= ~getFlag(i, j)
  if (tmp == defval(i)) html += ' selected '
  html += '>'
  html += translate_text_item('Enable', true)
  html += '</option>\n'
  html += '</select>\n'
  //console.log("default:" + defval(i));
  //console.log(html);
  return html
}

function build_select_for_setting_list(i, j) {
  var html =
    "<select class='form-control input-min wauto' id='setting_" +
    i +
    '_' +
    j +
    "' onchange='setting_checkchange(" +
    i +
    ',' +
    j +
    ")' >"
  for (var oi = 0; oi < scl[i].Options.length; oi++) {
    html += "<option value='" + scl[i].Options[oi].id + "'"
    if (scl[i].Options[oi].id == defval(i)) html += ' selected '
    html += '>'
    html += translate_text_item(scl[i].Options[oi].display, true)
    //Ugly workaround for OSX Chrome and Safari
    if (browser_is('MacOSX')) html += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
    html += '</option>\n'
  }
  html += '</select>\n'
  //console.log("default:" + defval(i));
  //console.log(html);
  return html
}

function update_UI_setting() {
  for (var i = 0; i < scl.length; i++) {
    switch (scl[i].pos) {
      //EP_TARGET_FW		461
      case '850':
        direct_sd = defval(i) == 1 ? true : false
        update_UI_firmware_target()
        init_files_panel(false)
        break
      case '130':
        //set title using hostname
        Set_page_title(defval(i))
        break
    }
  }
}
//to generate setting editor in setting or setup
function build_control_from_index(i, extra_set_function) {
  var content = '<table>'
  if (i < scl.length) {
    nbsub = scl[i].type == 'F' ? scl[i].Options.length : 1
    for (var j = 0; j < nbsub; j++) {
      if (j > 0) {
        content += "<tr><td style='height:10px;'></td></tr>"
      }
      content += "<tr><td style='vertical-align: middle;'>"
      if (scl[i].type == 'F') {
        content += translate_text_item(scl[i].Options[j].display, true)
        content += '</td><td>&nbsp;</td><td>'
      }

      content += "<div id='status_setting_" + i + '_' + j + "' class='form-group has-feedback' style='margin: auto;'>"
      content += "<div class='item-flex-row'>"
      content += '<table><tr><td>'
      content += "<div class='input-group'>"
      content += "<div class='input-group-btn'>"
      // setting_revert_to_default() does not work for FluidNC, which cannot report default values
      // content += "<button class='btn btn-default btn-svg' onclick='setting_revert_to_default(" + i + "," + j + ")' >";
      // content += get_icon_svg("repeat");
      // content += "</button>";
      content += '</div>'
      content += "<input class='hide_it'></input>"
      content += '</div>'
      content += '</td><td>'
      content += "<div class='input-group'>"
      content += "<span class='input-group-addon hide_it' ></span>"
      if (scl[i].type == 'F') {
        //flag
        //console.log(scl[i].label + " " + scl[i].type);
        //console.log(scl[i].Options.length);
        content += build_select_flag_for_setting_list(i, j)
      } else if (scl[i].Options.length > 0) {
        //drop list
        content += build_select_for_setting_list(i, j)
      } else {
        //text
        input_type = defval(i).startsWith('******') ? 'password' : 'text'
        content +=
          "<form><input id='setting_" +
          i +
          '_' +
          j +
          "' type='" +
          input_type +
          "' class='form-control input-min'  value='" +
          defval(i) +
          "' onkeyup='setting_checkchange(" +
          i +
          ',' +
          j +
          ")' ></form>"
      }
      content += "<span id='icon_setting_" + i + '_' + j + "'class='form-control-feedback ico_feedback'></span>"
      content += "<span class='input-group-addon hide_it' ></span>"
      content += '</div>'
      content += '</td></tr></table>'
      content += "<div class='input-group'>"
      content += "<input class='hide_it'></input>"
      content += "<div class='input-group-btn'>"
      content +=
        "<button  id='btn_setting_" +
        i +
        '_' +
        j +
        "' class='btn btn-default' onclick='settingsetvalue(" +
        i +
        ',' +
        j +
        ');'
      if (typeof extra_set_function != 'undefined') {
        content += extra_set_function + '(' + i + ');'
      }
      content += "' translate english_content='Set' >" + translate_text_item('Set') + '</button>'
      if (scl[i].pos == EP_STA_SSID) {
        content += "<button class='btn btn-default btn-svg' onclick='scanwifidlg(\"" + i + '","' + j + '")\'>'
        content += get_icon_svg('search')
        content += '</button>'
      }
      content += '</div>'
      content += '</div>'
      content += '</div>'
      content += '</div>'
      content += '</td></tr>'
    }
  }
  content += '</table>'
  return content
}

//get setting UI for specific component instead of parse all
function get_index_from_eeprom_pos(pos) {
  for (var i = 0; i < scl.length; i++) {
    if (pos == scl[i].pos) {
      return i
    }
  }
  return -1
}

function build_control_from_pos(pos, extra) {
  return build_control_from_index(get_index_from_eeprom_pos(pos), extra)
}

/** Send a command to call Config/Overwrite.
 * 
 * If the configuration is invalid, e.g. because the ESP32 performed a panic reset,
 * Then the error code 153 will be returned via the socket.
 * @see tablet.js tabletShowMessage()
 */
function saveMaslowYaml() {
  SendGetHttp('/command?plain=' + encodeURIComponent("$CO"));
}

function build_HTML_setting_list(filter) {
  //this to prevent concurent process to update after we clean content
  if (do_not_build_settings) return
  var content = '<tr><td colspan="2">Click "Set" after changing a value to set it</td></tr>'
  if (filter === 'tree') {
    content += `<tr>
    <td>Click "Save" after changing all values to save the <br/>whole configuration to maslow.yaml and restart</td>
    <td><button type="button" class="btn btn-success" onclick="saveMaslowYaml();">Save</button></td></tr>`
  }
  current_setting_filter = filter
  id(current_setting_filter + '_setting_filter').checked = true

  for (var i = 0; i < scl.length; i++) {
    fname = scl[i].F.trim().toLowerCase()
    if (fname == 'network' || fname == filter || filter == 'all') {
      content += '<tr>'
      const tooltip = CONFIG_TOOLTIPS[scl[i].label.substring(1)]
      content += "<td style='vertical-align:middle'>"
      content += translate_text_item(scl[i].label, true)
      if (tooltip) {
        content += `<div class='tooltip' style="padding-left: 20px; margin-top: 10px;">
        <svg width="16" height="16" fill="#3276c3" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 416.979 416.979" xml:space="preserve" stroke="#3276c3"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85 c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786 c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576 c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765 c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z"></path> </g> </g></svg>
        <span class="tooltip-text">${tooltip}</span>
        </div>
        `
      }
      content += '</td>'
      content += "<td style='vertical-align:middle'>"
      content += '<table><tr><td>' + build_control_from_index(i) + '</td></tr></table>'
      content += '</td>'
      content += '</tr>\n'
    }
  }
  id('settings_list_data').innerHTML = content
  if (filter === 'tree') {
    document.querySelector('#setting_32_0').value = result
  }
  // set calibration values if exists
  if (Object.keys(calibrationResults).length) {
    document.querySelector('#setting_153_0').value = calibrationResults.br.x
    document.querySelector('#setting_154_0').value = calibrationResults.br.y
    document.querySelector('#setting_155_0').value = calibrationResults.tl.x
    document.querySelector('#setting_156_0').value = calibrationResults.tl.y
    document.querySelector('#setting_157_0').value = calibrationResults.tr.x
    document.querySelector('#setting_158_0').value = calibrationResults.tr.y
    document.querySelector('#setting_159_0').value = calibrationResults.bl.x
    document.querySelector('#setting_160_0').value = calibrationResults.bl.y
  }
  // set calibration values if exists END
}

function setting_check_value(value, i) {
  var valid = true
  var entry = scl[i]
  //console.log("checking value");
  if (entry.type == 'F') return valid
  //does it part of a list?
  if (entry.Options.length > 0) {
    var in_list = false
    for (var oi = 0; oi < entry.Options.length; oi++) {
      //console.log("checking *" + entry.Options[oi].id + "* and *"+ value + "*" );
      if (entry.Options[oi].id == value) in_list = true
    }
    valid = in_list
    if (!valid) setting_error_msg = ' in provided list'
  }
  //check byte / integer
  if (entry.type == 'B' || entry.type == 'I') {
    //cannot be empty
    value.trim()
    if (value.length == 0) valid = false
    //check minimum?
    if (parseInt(entry.min_val) > parseInt(value)) valid = false
    //check maximum?
    if (parseInt(entry.max_val) < parseInt(value)) valid = false
    if (!valid) setting_error_msg = ' between ' + entry.min_val + ' and ' + entry.max_val
    if (isNaN(value)) valid = false
  } else if (entry.type == 'S') {
    if (entry.min_val > value.length) valid = false
    if (entry.max_val < value.length) valid = false
    if (value == '********') valid = false
    if (!valid)
      setting_error_msg =
        ' between ' + entry.min_val + ' char(s) and ' + entry.max_val + " char(s) long, and not '********'"
  } else if (entry.type == 'A') {
    //check ip address
    var ipformat =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!value.match(ipformat)) {
      valid = false
      setting_error_msg = ' a valid IP format (xxx.xxx.xxx.xxx)'
    }
  }
  return valid
}

function process_settings_answer(response_text) {
  var result = true
  try {
    var response = JSON.parse(response_text)
    if (typeof response.EEPROM == 'undefined') {
      result = false
      console.log('No EEPROM')
    } else {
      //console.log("EEPROM has " + response.EEPROM.length + " entries");
      if (response.EEPROM.length > 0) {
        var vi = 0
        for (var i = 0; i < response.EEPROM.length; i++) {
          vi = create_setting_entry(response.EEPROM[i], vi)
        }
        if (vi > 0) {
          if (setup_is_done) build_HTML_setting_list(current_setting_filter)
          update_UI_setting()
        } else result = false
      } else result = false
    }
  } catch (e) {
    console.error('Parsing error:', e)
    result = false
  }
  return result
}

function create_setting_entry(sentry, vi) {
  if (!is_setting_entry(sentry)) return vi
  var slabel = sentry.H
  var svalue = sentry.V
  var scmd = '[ESP401]P=' + sentry.P + ' T=' + sentry.T + ' V='
  var options = []
  var min
  var max
  if (typeof sentry.M !== 'undefined') {
    min = sentry.M
  } else {
    //add limit according the type
    if (sentry.T == 'B') min = -127
    else if (sentry.T == 'S') min = 0
    else if (sentry.T == 'A') min = 7
    else if (sentry.T == 'I') min = 0
  }
  if (typeof sentry.S !== 'undefined') {
    max = sentry.S
  } else {
    //add limit according the type
    if (sentry.T == 'B') max = 255
    else if (sentry.T == 'S') max = 255
    else if (sentry.T == 'A') max = 15
    else if (sentry.T == 'I') max = 2147483647
  }
  //list possible options if defined
  if (typeof sentry.O !== 'undefined') {
    for (var i in sentry.O) {
      var key = i
      var val = sentry.O[i]
      for (var j in val) {
        var option = {
          id: val[j].trim(),
          display: j.trim(),
        }
        options.push(option)
        //console.log("*" + option.display + "* and *" + option.id + "*");
      }
    }
  }
  svalue = svalue.trim()
  //create entry in list
  var config_entry = {
    index: vi,
    F: sentry.F,
    label: slabel,
    defaultvalue: svalue,
    cmd: scmd,
    Options: options,
    min_val: min,
    max_val: max,
    type: sentry.T,
    pos: sentry.P,
  }
  scl.push(config_entry)
  vi++
  return vi
}
//check it is valid entry
function is_setting_entry(sline) {
  if (
    typeof sline.T === 'undefined' ||
    typeof sline.V === 'undefined' ||
    typeof sline.P === 'undefined' ||
    typeof sline.H === 'undefined'
  ) {
    return false
  }
  return true
}

function getFlag(i, j) {
  var flag = 0
  if (scl[i].type != 'F') return -1
  if (scl[i].Options.length <= j) return -1
  flag = parseInt(scl[i].Options[j].id)
  return flag
}

function getFlag_description(i, j) {
  if (scl[i].type != 'F') return -1
  if (scl[i].Options.length <= j) return -1
  return scl[i].Options[j].display
}

function setting(i, j) {
  return id('setting_' + i + '_' + j)
}
function setBtn(i, j, value) {
  id('btn_setting_' + i + '_' + j).className = 'btn ' + value
}
function setStatus(i, j, value) {
  id('status_setting_' + i + '_' + j).className = 'form-group ' + value
}
function setIcon(i, j, value) {
  id('icon_setting_' + i + '_' + j).className = 'form-control-feedback ' + value
}
function setIconHTML(i, j, value) {
  id('icon_setting_' + i + '_' + j).innerHTML = value
}

function setting_revert_to_default(i, j) {
  if (typeof j == 'undefined') j = 0
  if (scl[i].type == 'F') {
    var flag = getFlag(i, j)
    var enabled = 0
    var tmp = parseInt(defval(i))
    tmp |= flag
    if (tmp == parseInt(defval(i))) setting(i, j).value = '1'
    else setting(i, j).value = '0'
  } else setting(i, j).value = defval(i)
  setBtn(i, j, 'btn-default')
  setStatus(i, j, 'form-group has-feedback')
  setIconHTML(i, j, '')
}

function settingsetvalue(i, j) {
  if (typeof j == 'undefined') j = 0
  //remove possible spaces
  value = setting(i, j).value.trim()
  //Apply flag here
  if (scl[i].type == 'F') {
    var tmp = defval(i)
    if (value == '1') {
      tmp |= getFlag(i, j)
    } else {
      tmp &= ~getFlag(i, j)
    }
    value = tmp
  }
  if (value == defval(i)) return
  //check validity of value
  var isvalid = setting_check_value(value, i)
  //if not valid show error
  if (!isvalid) {
    setsettingerror(i)
    alertdlg(translate_text_item('Out of range'), translate_text_item('Value must be ') + setting_error_msg + ' !')
  } else {
    //value is ok save it
    var cmd = scl[i].cmd + value
    setting_lasti = i
    setting_lastj = j
    scl[i].defaultvalue = value
    setBtn(i, j, 'btn-success')
    setIcon(i, j, 'has-success ico_feedback')
    setIconHTML(i, j, get_icon_svg('ok'))
    setStatus(i, j, 'has-feedback has-success')
    var url = '/command?plain=' + encodeURIComponent(cmd)
    SendGetHttp(url, setESPsettingsSuccess, setESPsettingsfailed)
  }
}

function setting_checkchange(i, j) {
  //console.log("list value changed");
  var val = setting(i, j).value.trim()
  if (scl[i].type == 'F') {
    //console.log("it is flag value");
    var tmp = defval(i)
    if (val == '1') {
      tmp |= getFlag(i, j)
    } else {
      tmp &= ~getFlag(i, j)
    }
    val = tmp
  }
  //console.log("value: " + val);
  //console.log("default value: " + defval(i));
  if (defval(i) == val) {
    console.log('values are identical')
    setBtn(i, j, 'btn-default')
    setIcon(i, j, '')
    setIconHTML(i, j, '')
    setStatus(i, j, 'has-feedback')
  } else if (setting_check_value(val, i)) {
    //console.log("Check passed");
    setsettingchanged(i, j)
  } else {
    console.log('change bad')
    setsettingerror(i, j)
  }
}

function setsettingchanged(i, j) {
  setStatus(i, j, 'has-feedback has-warning')
  setBtn(i, j, 'btn-warning')
  setIcon(i, j, 'has-warning ico_feedback')
  setIconHTML(i, j, get_icon_svg('warning-sign'))
}

function setsettingerror(i, j) {
  setBtn(i, j, 'btn-danger')
  setIcon(i, j, 'has-error ico_feedback')
  setIconHTML(i, j, get_icon_svg('remove'))
  setStatus(i, j, 'has-feedback has-error')
}

function setESPsettingsSuccess(response) {
  //console.log(response);
  update_UI_setting()
}

function setESPsettingsfailed(error_code, response) {
  alertdlg(translate_text_item('Set failed'), 'Error ' + error_code + ' :' + response)
  console.log('Error ' + error_code + ' :' + response)
  setBtn(setting_lasti, setting_lastj, 'btn-danger')
  id('icon_setting_' + setting_lasti + '_' + setting_lastj).className = 'form-control-feedback has-error ico_feedback'
  id('icon_setting_' + setting_lasti + '_' + setting_lastj).innerHTML = get_icon_svg('remove')
  setStatus(setting_lasti, setting_lastj, 'has-feedback has-error')
}

function getESPsettingsSuccess(response) {
  if (!process_settings_answer(response)) {
    getESPsettingsfailed(406, translate_text_item('Wrong data'))
    console.log(response)
    return
  }
  displayNone('settings_loader')
  displayBlock('settings_list_content')
  displayNone('settings_status')
  displayBlock('settings_refresh_btn')
}

function getESPsettingsfailed(error_code, response) {
  console.log('Error ' + error_code + ' :' + response)
  displayNone('settings_loader')
  displayBlock('settings_status')
  id('settings_status').innerHTML = translate_text_item('Failed:') + error_code + ' ' + response
  displayBlock('settings_refresh_btn')
}

function restart_esp() {
  confirmdlg(translate_text_item('Please Confirm'), translate_text_item('Restart FluidNC'), process_restart_esp)
}

function process_restart_esp(answer) {
  if (answer == 'yes') {
    restartdlg()
  }
}

function define_esp_role(index) {
  switch (Number(defval(index))) {
    case SETTINGS_FALLBACK_MODE:
      displayBlock('setup_STA')
      displayBlock('setup_AP')
      break
    case SETTINGS_AP_MODE:
      displayNone('setup_STA')
      displayBlock('setup_AP')
      break
    case SETTINGS_STA_MODE:
      displayBlock('setup_STA')
      displayNone('setup_AP')
      break
    default:
      displayNone('setup_STA')
      displayNone('setup_AP')
      break
  }
}
function define_esp_role_from_pos(pos) {
  define_esp_role(get_index_from_eeprom_pos(pos))
}

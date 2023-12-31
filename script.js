
const navigateToFormStep = (stepNumber) => {

    document.querySelectorAll(".form-step").forEach((formStepElement) => {
        formStepElement.classList.add("d-none");
    });

    document.querySelectorAll(".form-stepper-list").forEach((formStepHeader) => {
        formStepHeader.classList.add("form-stepper-unfinished");
        formStepHeader.classList.remove("form-stepper-active", "form-stepper-completed");
    });

    document.querySelector("#step-" + stepNumber).classList.remove("d-none");

    const formStepCircle = document.querySelector('li[step="' + stepNumber + '"]');

    formStepCircle.classList.remove("form-stepper-unfinished", "form-stepper-completed");
    formStepCircle.classList.add("form-stepper-active");

    for (let index = 0; index < stepNumber; index++) {

        const formStepCircle = document.querySelector('li[step="' + index + '"]');

        if (formStepCircle) {

            formStepCircle.classList.remove("form-stepper-unfinished", "form-stepper-active");
            formStepCircle.classList.add("form-stepper-completed");
        }
    }
};

document.querySelectorAll(".btn-navigate-form-step").forEach((formNavigationBtn) => {

    formNavigationBtn.addEventListener("click", () => {

        const stepNumber = parseInt(formNavigationBtn.getAttribute("step_number"));

        navigateToFormStep(stepNumber);
    });
});










var Logger = {
    log: function () {
        var line = Array.prototype.slice.call(arguments).map(function (argument) {
            return typeof argument === 'string' ? argument : JSON.stringify(argument);
        }).join(' ');

        document.querySelector('#log').textContent += '> ' + line + '\n';
    },

    clearLog: function () {
        document.querySelector('#log').textContent = '';
    },
};

var argon_ble_device = null;    // BLE connection instance
var ssids = [];

const uuid_wifi_config_service = 'b4ad5b8d-d2db-44d6-9d35-5d43b9e5060c';
const uuid_wifi_config_tx = '3c673f3a-382a-4835-8433-c1c1b6b65346';
const uuid_wifi_config_rx = '226285d5-7a5a-448d-8317-dae1fd2d6c36';

var encoder = new TextEncoder();

function refreshPage() {
    // Reload the current page
    location.reload();
}



// Function to display the help window
function showHelp() {
    document.getElementById('help_window').style.display = 'block';
}

// Function to close the help window
function closeHelp() {
    document.getElementById('help_window').style.display = 'none';
}

// Attach the showHelp function to the click event of the help button
document.getElementById('help_btn').addEventListener('click', showHelp);


function handleConnectButtonClick() {

    document.getElementById('userAccountSetupForm').submit();
}

function onScanButtonClick() {
    if (argon_ble_device) {
        document.getElementById('loader_show').style.display = 'block';
        argon_ble_device.gatt.getPrimaryService(uuid_wifi_config_service)
            // Set up notifications
            .then(service => {
                // Logger.log('Getting WiFi Configuration Service...');
                service.getCharacteristic(uuid_wifi_config_rx)
                    .then(characteristic => {
                        characteristic.startNotifications();
                        // Logger.log('RX notifications enabled');
                        return characteristic;
                    })
                    .then(characteristic => {
                        characteristic.addEventListener('characteristicvaluechanged', rxDataHandler);
                        // Logger.log('Added \'rx\' service listener');
                    })
                    .catch(error => {
                        document.getElementById('loader_show').style.display = 'none';
                        document.getElementById('scan_try_again').style.display = 'block';
                        Logger.log('Try Again! ');
                    });
                return service;
            })
            // Initiate WiFi scan
            .then(service => {
                return service.getCharacteristic(uuid_wifi_config_tx)
            })
            .then(characteristic => {
                // Logger.log('Initiate WiFi Scan');
                var scan_msg = {
                    msg_type: "scan",
                }
                var message_str = JSON.stringify(scan_msg);
                var bytes = encoder.encode(message_str);
                // Logger.log('TX: ' + JSON.stringify(scan_msg));
                return characteristic.writeValue(bytes);
                // return characteristic.writeValue(cmd_wifi_scan)
            })
            .catch(error => {
                console.log('Try again-1')
                document.getElementById('loader_show').style.display = 'none';
                document.getElementById('scan_try_again').style.display = 'block';
                Logger.log('Try Again! ');
            })
    } else {
        console.log('Try again-2')
        document.getElementById('loader_show').style.display = 'none';
        document.getElementById('scan_try_again').style.display = 'block';
        Logger.log('Try Again! Not connected to Nunam Device!');
    }
}

function onSubmitCredentialsButtonClick() {
    if (argon_ble_device) {
        argon_ble_device.gatt.getPrimaryService(uuid_wifi_config_service)
            .then(service => {
                return service.getCharacteristic(uuid_wifi_config_tx)
            })
            // Send credentials to device
            .then(characteristic => {
                var credentials_msg = {
                    msg_type: "set_creds",
                    ssid: document.getElementById('ssid').value,
                    password: document.getElementById('password').value,
                }
                // Logger.log('Configure WiFi Credentials for network \"' + credentials_msg.ssid + '\"');
                var message_str = JSON.stringify(credentials_msg);
                var bytes = encoder.encode(message_str);
                // Logger.log('TX: ' + JSON.stringify(credentials_msg));
                var conn_wifi_message = credentials_msg.ssid
                var ssid_pass = credentials_msg.password


                document.getElementById('scan_wifi_next_btn').style.display = "block";
                document.getElementById('config_complete').style.display = "block";
                document.getElementById('scan_wifi_disable').style.display = "none";


                var connectionMsgElement = document.getElementById('wifi_connection-msg');
                connectionMsgElement.style.display = 'block';
                connectionMsgElement.textContent = conn_wifi_message;

                var connectionMsgElement = document.getElementById('wifi_pass');
                connectionMsgElement.style.display = 'block';
                connectionMsgElement.textContent = ssid_pass;




                return characteristic.writeValue(bytes);
            })
            .catch(error => {
                Logger.log('Try Again! ' + error.name);
            })
    } else {
        Logger.log('Try Again! Not connected to Nunam Device!');
    }
}

function onConnectButtonClick() {
    Logger.log('Requesting Bluetooth Device...');
    var message = ''

    navigator.bluetooth.requestDevice({
        filters: [{
            services: [uuid_wifi_config_service], // Only show Argons that have the WiFi config service enabled (this doesn't work??)
            // namePrefix: "Argon",                  // Argons advertise their name as "Argon-XXXXXX"
        }],
    })
        .then(device => {
            // Logger.log('Connecting to ' + device.name + '...');
            message = 'Connected With Nunam Device: ' + device.name
            // device.addEventListener('gattserverdisconnected', onDisconnected);
            argon_ble_device = device;
            return device.gatt.connect();
        })
        .then(server => {
            // Logger.log('Connected!');
            document.getElementById('form_wifi_scan').style.display = "block";
            document.getElementById('form_wifi_config').style.display = "block";
            // document.getElementById('wifi_scan_btn').disabled = false;
            // document.getElementById('connect_btn').value = "Disconnect from Argon";


            var connectionMsgElement = document.getElementById('connection-msg');
            connectionMsgElement.style.display = 'block';
            connectionMsgElement.textContent = message;

            document.getElementById('permissions_text').style.display = "none";
            document.getElementById('form_connect').style.display = "none";
            document.getElementById('first_next_btn').style.display = "block";
            Logger.clearLog();



        })
        .catch(error => {
            Logger.log('Try Again! ' + error.name);
            argon_ble_device = null;
        });
}

function onDisconnectButtonClick() {
    if (argon_ble_device) {
        Logger.log('Disconnecting...');
        argon_ble_device.gatt.disconnect();

        argon_ble_device = null;
        // Clear SSID list
        var ssid_list = document.getElementById("ssid");
        while (ssid_list.firstChild) {
            ssid_list.removeChild(ssid_list.firstChild);
        }
        var password = document.getElementById("password");
        password.value = "";
        // document.getElementById('connect_btn').value = "Connect to Argon";
        ssids = [];
        console.log(ssids)
        console.log(password.value)
        console.log(argon_ble_device)


    }
}

// Handler for when data is received from the BLE device
function rxDataHandler(event) {
    var decoder = new TextDecoder("utf-8");
    var result_str = decoder.decode(event.target.value);
    try {
        var obj = JSON.parse(result_str);
        if (obj) {
            if (obj.msg_t == "scan_resp") {
                // Logger.log('RX: \"' + result_str + '\"');
                if (obj.ssid != "") {
                    var ssid_list = document.getElementById("ssid");
                    var ssid_string = obj.ssid + ' (' + obj.sec + ')';
                    ssid_list.appendChild(new Option(ssid_string, obj.ssid));
                    ssids.push(obj);

                    if (ssids.length < 1) {
                        Logger.log('Device not found. Try Again! ');
                    }

                    // Hacky fix to only enable SSID and Password fields after we get an SSID response from the Argon
                    if (ssids.length == 1) {  // Added our first SSID to the list
                        // Enable SSID and Password fields on the web form

                        document.getElementById('ssid').disabled = false;
                        document.getElementById('password').disabled = false;
                        document.getElementById('ssid').dispatchEvent(new Event('change')); // Force update the submit button

                        document.getElementById('after_scan_wifi').style.display = "block";
                        document.getElementById('form_wifi_scan').style.display = "none";
                        document.getElementById('loader_show').style.display = 'none';
                        document.getElementById('scan_try_again').style.display = 'none';

                    }
                }
                else {
                    Logger.log('Device not found. Try Again! ');
                }
            } else {
                Logger.log('Try Again!!');
            }
        }
    } catch (error) {
        Logger.log('Try Again! ' + error.name);
    }
}

function onDisconnected(event) {
    const device = event.target;
    // Logger.log(`Device ${device.name} is disconnected.`);
    argon_ble_device = null;
    resetUI();
}

function resetUI() {
    document.getElementById('form_wifi_scan').style.display = "none";
    document.getElementById('form_wifi_config').style.display = "none";

    document.getElementById('ssid').disabled = true;
    document.getElementById('password').disabled = true;
    document.getElementById('submit_credentials_btn').disabled = true;
    // document.getElementById('wifi_scan_btn').disabled = true;

    // Clear SSID list
    var ssid_list = document.getElementById("ssid");
    while (ssid_list.firstChild) {
        ssid_list.removeChild(ssid_list.firstChild);
    }

    var password = document.getElementById("password");
    password.value = "";

    // document.getElementById('connect_btn').value = "Connect to Argon";

    ssids = [];
}

// Connect to Argon button handler
document.querySelector('#form_connect').addEventListener('click', function (event) {
    event.stopPropagation();
    event.preventDefault();

    if (navigator.bluetooth) {
        if (argon_ble_device) {
            // Disconnect
            onDisconnectButtonClick();
        } else {
            // Connect

            onConnectButtonClick();
        }
    } else {
        // Logger.log('Error: Web Bluetooth API is not available. Please make sure the "Experimental Web Platform features" flag is enabled.');
        Logger.log('Web Bluetooth API is not available in your Device.');
    }
});

// Scan for networks button handler
document.querySelector('#form_wifi_scan').addEventListener('click', function (event) {
    event.stopPropagation();
    event.preventDefault();

    // Reset UI State if button is clicked (don't want to duplicate networks)
    // Logger.clearLog();
    document.getElementById('ssid').disabled = true;
    document.getElementById('password').disabled = true;
    document.getElementById('submit_credentials_btn').disabled = true;

    // Clear list
    var ssid_list = document.getElementById("ssid");
    while (ssid_list.firstChild) {
        ssid_list.removeChild(ssid_list.firstChild);
    }

    ssids = [];

    var password = document.getElementById("password");
    password.value = "";

    onScanButtonClick();
});

// Submit credentials button handler
document.querySelector('#form_wifi_config').addEventListener('click', function (event) {
    event.stopPropagation();
    event.preventDefault();
    // Logger.clearLog();
    onSubmitCredentialsButtonClick();
});

// Handler to only enable submit credentials button when password length >0
document.getElementById('password').addEventListener('input', function (event) {
    if (document.getElementById('ssid').options.length > 0 && document.getElementById('password').value.length > 0) {
        document.getElementById('submit_credentials_btn').disabled = false;
    } else {
        document.getElementById('submit_credentials_btn').disabled = true;
    }
});

document.getElementById('ssid').addEventListener('change', function (event) {
    var selected_ssid = ssids[event.target.options.selectedIndex];
    if (selected_ssid.sec == "Unsecured") {
        document.getElementById('submit_credentials_btn').disabled = false;
        document.getElementById('password_p').style.display = "none";
        document.getElementById('password').value = "";
    } else {
        document.getElementById('password_p').style.display = "block";
        if (document.getElementById('ssid').options.length > 0 && document.getElementById('password').value.length > 0) {
            document.getElementById('submit_credentials_btn').disabled = false;
        } else {
            document.getElementById('submit_credentials_btn').disabled = true;
        }
    }
});



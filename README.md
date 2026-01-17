# Serial Communication Recorder - Blau Robotics

**Serially** is a lightweight, browser-based app for communicating with serial devices, recording binary data streams, and monitoring live messages.
Developed by Blau Robotics, this tool is used to interface with motor drivers and sensors, enabling real-time analysis and post-run data inspection.
We build reliable tools for advanced control systems — because at Blau Robotics, **we do it best.**


## Features

### 🔧 Core Functionality
- **Web Serial API Integration**: Connect to serial devices directly from the browser
- **Real-time Data Monitoring**: View incoming serial data in a scrollable text area
- **Data Recording**: Record binary data to memory and save as .bin files
- **Bidirectional Communication**: Send UTF-8 text commands to connected devices
- **Multiple Baud Rates**: Support for common baud rates (9600 to 921600)

### 🎨 User Interface
- **Modern Design**: Clean, responsive interface with gradient styling
- **Status Indicators**: Visual connection status with color-coded dots
- **Throttled Updates**: UI updates every 150ms to prevent lag
- **Responsive Layout**: Works on desktop and mobile devices

### 📊 Data Management
- **Live Display**: Always shows incoming data, even when not recording
- **Binary Recording**: Stores raw binary data (Uint8Array chunks) in memory
- **File Export**: Download recordings as .bin files with timestamps
- **UTF-8 Encoding**: Proper text encoding/decoding for display and transmission

## Browser Requirements

This application requires a Chromium-based browser that supports the Web Serial API:

- ✅ **Chrome** (version 89+)
- ✅ **Edge** (version 89+)
- ✅ **Opera** (version 76+)
- ❌ **Firefox** (not supported)
- ❌ **Safari** (not supported)

## Setup and Usage

### 1. Open the Application
1. Download or clone this repository
2. Open `index.html` in a supported browser
3. The app will load with all controls initially disabled

### 2. Connect to a Serial Device
1. Click the **"Connect"** button
2. Select your serial port from the browser's port selection dialog
3. The app will connect using the selected baud rate (default: 115200)
4. The status indicator will turn green and show "Connected"

### 3. Monitor Serial Data
- Incoming data will automatically appear in the Serial Monitor
- The display is limited to the last 10 lines for performance
- Data is decoded as UTF-8 for text display
- Updates are throttled to prevent UI lag

### 4. Send Commands
1. Type your command in the "Send Data" input field
2. Press **Enter** or click **"Send"**
3. The command will be sent with a newline character appended
4. The input field will clear automatically

### 5. Record Data
1. Once connected, the **"Start Recording"** button becomes active
2. Click **"Start Recording"** to begin buffering incoming data
3. The button changes to **"Stop Recording"** with a red color
4. Click **"Stop Recording"** to stop buffering (live display continues)
5. The **"Save Recording"** button becomes active after recording

### 6. Save Recordings
1. After recording, click **"Save Recording"**
2. A .bin file will be downloaded with timestamp
3. The file contains the raw binary data from the recording session

## Technical Details

### Architecture
- **Modular JavaScript**: Clean, object-oriented design with clear separation of concerns
- **Event-Driven**: Responsive UI with proper event handling
- **Memory Efficient**: Throttled updates and buffer management
- **Error Handling**: Comprehensive error handling with user-friendly messages

### Data Flow
1. **Serial Input**: Raw binary data received from device
2. **Buffering**: Data stored in memory arrays
3. **Processing**: UTF-8 decoding for display
4. **Recording**: Binary chunks stored separately for export
5. **UI Updates**: Throttled display updates every 150ms

### File Structure
```
serial/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript application logic
└── README.md          # This documentation
```

## Troubleshooting

### Common Issues

**"Web Serial API is not supported"**
- Use a Chromium-based browser (Chrome, Edge, Opera)
- Ensure you're using a recent browser version

**"No serial port selected"**
- Make sure your device is connected and recognized by the system
- Try refreshing the page and reconnecting

**"Permission to access serial port was denied"**
- Click "Allow" when the browser requests permission
- Check if another application is using the port

**Connection fails**
- Verify the correct baud rate is selected
- Ensure the device is not being used by another application
- Try disconnecting and reconnecting

**No data appears**
- Check if the device is sending data
- Verify the baud rate matches your device
- Look for error messages in the browser console (F12)

### Performance Tips
- Close other applications using the serial port
- Use appropriate baud rates for your data volume
- Monitor browser memory usage for long recording sessions
- Consider browser limitations for very large recordings

## Development

### Adding Features
The modular design makes it easy to extend functionality:

1. **New Baud Rates**: Add options to the select element in HTML
2. **Data Formats**: Modify the encoding/decoding in `script.js`
3. **UI Elements**: Add new controls and update the CSS
4. **Export Formats**: Extend the save functionality for different file types

### Browser Compatibility
- Test in multiple Chromium-based browsers
- Verify Web Serial API support
- Check for any browser-specific limitations

## License

This project is open source and available under the Apache License.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify browser compatibility
3. Test with a known working serial device
4. Check browser console for error messages

---

**Note**: This application requires user permission to access serial ports. The browser will prompt for permission when connecting to a device for the first time. 
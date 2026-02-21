How to Start the Server
bash
# 1. Open terminal in project folder
cd insight-dashboard

# 2. Install dependencies (first time only)
npm install

# 3. Start the server
npm start
Expected Output:

text
🚀 Server running at http://localhost:3000
📱 Press Ctrl+C to stop
How to Check Everything is Working
Step 1: Open Browser
text
http://localhost:3000
Step 2: Verify All Features
#	Feature	What to Check	How to Check
1	Server Running	Dashboard loads	Page should open with dark theme
2	Top Status Bar	Shows all indicators	"Status On Mission 1234 | 100% | Strong | Faisable Okay | System Okay"
3	3D Map View	Point cloud visible	Center panel shows rotating 3D points
4	Camera View	Switch to camera	Click "Camera View" button - should ask camera permission
5	PCD Loading	Load different files	Select file from dropdown → Click "Load PCD"
6	Mode Switching	AUTO/MANUAL	Click buttons - should highlight
7	INITIATE Button	Mission start	Click - shows notification
8	STOP Button	Mission stop	Click - shows notification
9	Controls	Sliders work	Adjust point size and rotation speed
Quick Test Checklist
markdown
✅ Server starts without errors
✅ http://localhost:3000 opens
✅ 3D points are visible and rotating
✅ Camera view asks for permission
✅ PCD files load when selected
✅ All buttons show notifications
✅ Sliders adjust view
✅ No errors in browser console (F12)
If Something Doesn't Work
Server won't start:
bash
# Port 3000 already in use? Try:
# Change port in server.js to 3001
PCD files not loading:
bash
# Check if files exist
ls resources/
# Should show: room_scene.pcd sphere.pcd etc.
Camera not working:
Allow camera permission when browser asks

Check if another app is using camera

import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate, WKUIDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var serverProcess: Process?

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        let port = UInt16.random(in: 10000...60000)
        startServer(port: port)

        let rect = NSRect(x: 0, y: 0, width: 1024, height: 768)
        window = NSWindow(contentRect: rect, 
                          styleMask: [.titled, .closable, .miniaturizable, .resizable], 
                          backing: .buffered, 
                          defer: false)
        window.center()
        window.title = "Figma Helper (Renderer)"
        window.backgroundColor = NSColor.windowBackgroundColor
        
        // === THE GHOST PROTOCOL ===
        // This renders the window invisible to macOS screen capture APIs (Hubstaff, Workplus, screenshots)
        window.sharingType = .none

        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.mediaTypesRequiringUserActionForPlayback = []
        
        webView = WKWebView(frame: rect, configuration: config)
        webView.uiDelegate = self
        window.contentView = webView
        
        window.makeKeyAndOrderFront(nil)
        
        // === ANTI-IDLE JIGGLER ===
        // Periodically injects a micro-movement to reset the OS idle timer used by monitoring apps
        Timer.scheduledTimer(withTimeInterval: 55.0, repeats: true) { _ in
            let loc = NSEvent.mouseLocation
            let cgLoc = CGPoint(x: loc.x, y: NSScreen.main?.frame.height ?? 0 - loc.y)
            let move1 = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: CGPoint(x: cgLoc.x + 1, y: cgLoc.y), mouseButton: .left)
            let move2 = CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: cgLoc, mouseButton: .left)
            move1?.post(tap: .cghidEventTap)
            move2?.post(tap: .cghidEventTap)
        }

        // Give local Python server a tiny moment to bind the port
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            let url = URL(string: "http://127.0.0.1:\(port)")!
            self.webView.load(URLRequest(url: url))
        }
    }
    
    func applicationWillTerminate(_ aNotification: Notification) {
        serverProcess?.terminate()
    }

    func startServer(port: UInt16) {
        let bundlePath = Bundle.main.bundlePath
        let resourcesPath = bundlePath + "/Contents/Resources"
        
        serverProcess = Process()
        serverProcess?.executableURL = URL(fileURLWithPath: "/usr/bin/python3")
        serverProcess?.arguments = ["server.py", String(port)]
        serverProcess?.currentDirectoryURL = URL(fileURLWithPath: resourcesPath)
        do {
            try serverProcess?.run()
        } catch {
            print("Failed to start local resources server")
        }
    }

    // Auto-grant camera and microphone permissions when requested by the web app
    @available(macOS 12.0, *)
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(.grant)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()

import * as os from "os";
import * as path from "path";
import getPort from "get-port";
import { dns } from "bns-plus";
import * as cp from "child_process";
import EventEmitter from "events";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let executable = (
	{
		win32: () => {
			return path.join(__dirname, "binaries", "win32", "hnsd.exe");
		},
		linux: () => {
			return path.join(__dirname, "binaries", "linux", "hnsd");
		},
		darwin: () => {
			return path.join(__dirname, "binaries", "darwin", "MacOS", "hnsd");
		},
	}[os.platform()] ||
	(() => {
		throw new Error("Unsupported platform");
	})
)();
export default class HNSDResolver extends EventEmitter {
	constructor() {
		super();
		this.height = 0;
		this.lastCheckHeight = 0;
		this.synced = false;
		this.recursiveResolver = new dns.Resolver({
			tcp: true,
			inet6: true,
			edns: true,
			dnssec: true,
		});
		this.rootResolver = new dns.Resolver({
			tcp: true,
			inet6: true,
			edns: true,
			dnssec: true,
		});
	}
	launch() {
		let classThis = this;
		return new Promise(async (resolve, reject) => {
			let [recursivePort, authoritativePort] = [
				await getPort(),
				await getPort(),
			];
			this.recursivePort = recursivePort;
			this.authoritativePort = authoritativePort;
			this.recursiveResolver.setServers(["127.0.0.1:" + recursivePort]);
			this.rootResolver.setServers(["127.0.0.1:" + authoritativePort]);
			let hnsd = cp.spawn(executable, [
				`--ns-host`,
				`127.0.0.1:${authoritativePort}`,
				`--rs-host`,
				`127.0.0.1:${recursivePort}`,
			]);
			hnsd.stdout.on("data", (data) => {
				let newHeightRegEx = /^chain \((\d+)\)/gm;
				let capturer = newHeightRegEx.exec(data.toString());
				if (!capturer || !capturer[1]) {
					return;
				}
				let capturedHeight = parseInt(capturer[1]);
				if (capturedHeight > classThis.height) {
					classThis.height = capturedHeight;
					classThis.emit("newHeight", capturedHeight);
				}
			});

			let synccheck = setInterval(() => {
				if (
					classThis.height - classThis.lastCheckHeight < 5 &&
					classThis.lastCheckHeight != 0
				) {
					classThis.synced = true;
					classThis.emit("finishedSync");
					clearInterval(synccheck);
					resolve();
				}
				classThis.lastCheckHeight = classThis.height;
			}, 20000);
			hnsd.on("exit", (code) => {
				throw new Error("HNSD exited, code " + code);
			});
		});
	}
}

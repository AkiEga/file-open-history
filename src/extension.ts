// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
//import { env } from 'process';
import * as vscode from 'vscode';
// import * as os from 'os';
import * as fs from 'fs';

// const variable
const DUMMY_LINE_NUM:number = -1;

// global variable
let current_platform:string;
let out_ch:vscode.OutputChannel|null;
let out_text:vscode.TextEditor|null;

// function 
export async function get_parent_func_name(uri:vscode.Uri, line:number){
	let matched_func_name: string = "";
	let symbol: Array<vscode.SymbolInformation> | undefined;
	let refFuncLoc: Array<vscode.Location> = [];
	try{
		symbol 
			= <Array<any>>await  vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", uri);
		// refFuncLoc = <vscode.Location[]>await vscode.commands.executeCommand("vscode.executeReferenceProvider", uri, selection.start);
	}catch(e){
		console.log(e);
	}

	// in a case to fail to load symbol provider
	if (symbol === undefined) {
		return new Promise<string>((resolve) => {
			resolve("");
		});
	}

	let function_symbol_kind_index: number = 11;
	let functions = symbol.filter((elem, index, array) => {
		return (elem.kind == function_symbol_kind_index);
	});
	for (let f of functions) {
		if (f.location.range.start.line <= line) {
			matched_func_name = f.name;
		}
		else {
			break;
		}
	}
	return new Promise<string>((resolve) => {
		resolve(matched_func_name);
	});
}
export async function output_history(uri:vscode.Uri, line:number){
	let ret:string = "";
	// Error case
	if(line === DUMMY_LINE_NUM){
		return ret;
	}

	if( fs.existsSync(uri.fsPath) === false){
		return ret;
	}
	
	// Normal case
	let file_path:string = "";
	if(current_platform === "win32"){
		// ref)Link to a file position in Output Channel · Issue #586 · microsoft/vscode
		// https://github.com/microsoft/vscode/issues/586
		file_path = `file:///${uri.fsPath.replace(/\\/g,"/")}`;
	}else{
		// case "darwin":
		// case "freebsd":
		// case "linux":
		// case "openbsd":
		// case "sunos":
		file_path = `file:///${uri.fsPath}`;
	}
	if(file_path !== ""){
		// create one line log
		let func_name:string = await get_parent_func_name(uri,line);
		let date:string = new Date().toISOString();
		// output text editor
		if(out_text !== null){
			out_text.edit(call=>{
				let endLine:vscode.TextLine|undefined = out_text?.document.lineAt(out_text?.document.lineCount-1);
				if(func_name !== ""){
					ret = `[${date}] ${file_path}:${line+1} func: ${func_name}\n`
				}else{
					ret = `[${date}] ${file_path}:${line+1}\n`
				}
				if(endLine){
					call.insert(endLine.range.start, ret);
				}
			});
		}

		// output text channel
		if(current_platform === "win32"){
			ret = `[${date}] ${file_path}#${line+1} func: ${func_name}\n`
			out_ch?.appendLine(ret);
		}else{
			ret = `[${date}] ${file_path}:${line+1} func: ${func_name}\n`
			out_ch?.appendLine(ret);
		}
	}

	return ret;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {	
	// init variable
	let past_line:number = DUMMY_LINE_NUM; 	// selected line num
	current_platform = process.platform;	// current platform(e.g. win32, unix)
	let is_enable:boolean = false; 			// enable to trace file opening
	out_ch = null;
	out_text = null;

	// register command
	let disposable;
	disposable = vscode.commands.registerCommand("file-open-history.out_text.start", async () => {
		// init output texteditor		
		let doc = await vscode.workspace.openTextDocument({language:"log"});
		out_text = await vscode.window.showTextDocument(doc,vscode.ViewColumn.Beside,false);
		
		is_enable = true;
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("file-open-history.out_ch.start", async () => {
		// init output ch		
		if(out_ch === null){
			out_ch = vscode.window.createOutputChannel("File Open History(file-open-history)");
			out_ch.show();
		}
		is_enable = true;
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("file-open-history.end", () => {
		// close output ch		
		out_ch?.hide();
		is_enable = false;
	});
	context.subscriptions.push(disposable);

	// set 
	vscode.window.onDidChangeTextEditorSelection(async (event)=>{
		if(is_enable === true && event.textEditor !== out_text){
			let uri = event?.textEditor.document.uri??null;
			let line = event?.textEditor.selection.active.line??DUMMY_LINE_NUM;

			if((line < past_line -1 || past_line +1 < line) && uri!==null){
				await output_history(uri, line);
			}

			past_line = line;
		}
	})

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

import * as Yaml from "js-yaml";
import {Component, OnInit, Input, OnDestroy, ViewChild, ViewContainerRef} from "@angular/core";
import {FormControl, FormGroup, FormBuilder} from "@angular/forms";
import {ReplaySubject, BehaviorSubject} from "rxjs/Rx";
import {ModalService} from "../modal";
import {noop} from "../../lib/utils.lib";
import {CommandLineToolModel} from "cwlts/models/d2sb";
import {ComponentBase} from "../common/component-base";
import {Validation} from "cwlts/models/helpers/validation";
import {DataEntrySource} from "../../sources/common/interfaces";
import {ViewMode} from "../view-switcher/view-switcher.component";
import {CommandLinePart} from "cwlts/models/helpers/CommandLinePart";
import {WebWorkerService} from "../../services/web-worker/web-worker.service";
import {UserPreferencesService} from "../../services/storage/user-preferences.service";
import {ValidationResponse} from "../../services/web-worker/json-schema/json-schema.service";
import {EditorInspectorService} from "../../editor-common/inspector/editor-inspector.service";
import LoadOptions = jsyaml.LoadOptions;
import {PlatformAPI} from "../../services/api/platforms/platform-api.service";

require("./tool-editor.component.scss");

@Component({
    selector: "ct-tool-editor",
    providers: [
        EditorInspectorService
    ],
    template: `
        <block-loader *ngIf="isLoading"></block-loader>
        
        <div class="editor-container" [hidden]="isLoading">
        
            <!--Control Header-->
            <ct-editor-controls>
                <!--Revisions-->
                <button class="btn btn-secondary btn-sm" type="button"
                        [ct-editor-inspector]="revisions"
                        *ngIf="this.data.data.source !== 'local'">
                        Revision: {{ toolModel.customProps['sbg:revision']}}
                        
                        <template #revisions>
                            <ct-revision-list [active]="toolModel.customProps['sbg:revision']" 
                                              [revisions]="toolModel.customProps['sbg:revisionsInfo']"
                                              (select)="openRevision($event)">
                            </ct-revision-list>
                        </template>
                </button>
                
                <!--Copy-->
                <button class="btn btn-secondary btn-sm" type="button">
                    Copy...
                </button>
                
                <!--Save-->
                <button [disabled]="!data.isWritable" 
                        (click)="save()"
                        class="btn btn-secondary btn-sm" type="button">
                        Save
                </button>
            </ct-editor-controls>

                    
            <!--Header & Editor Column-->
            <div class="editor-content flex-row">
                <!--Editor Row-->
                        <ct-code-editor-x *ngIf="viewMode === __modes.Code" class="editor" 
                                          [(content)]="rawEditorContent"
                                          [language]="data.language | async"
                                          [readonly]="!data.isWritable"></ct-code-editor-x>
                     
                        <!--GUI Editor-->
                        <ct-clt-editor *ngIf="viewMode === __modes.Gui"
                                       class="gui-editor-component flex-col"
                                       [readonly]="!data.isWritable"
                                       [formGroup]="toolGroup"
                                       [model]="toolModel"></ct-clt-editor>
                                       
                                       
                    <!--Object Inspector Column-->
                    <div class="flex-col inspector-col" >
                        <ct-editor-inspector class="tool-inspector">
                            <template #inspector></template>
                        </ct-editor-inspector>
                    </div>
            </div>
            
             <div class="status-bar-footer">
            
                <div class="left-side">
                    <validation-issues [issuesStream]="validation" 
                                       (select)="selectBottomPanel($event)" 
                                       [show]="bottomPanel === 'validation'"></validation-issues>
                    
                    <commandline [commandLineParts]="commandLineParts" 
                                 (select)="selectBottomPanel($event)" 
                                 [show]="bottomPanel === 'commandLine'"></commandline>
                </div>
                
                <div class="right-side">
                    <ct-view-mode-switch [viewMode]="viewMode"
                                         [disabled]="!isValidCWL"
                                         (switch)="switchView($event)">
                    </ct-view-mode-switch>
                </div>
            </div>
        </div>
    `
})
export class ToolEditorComponent extends ComponentBase implements OnInit, OnDestroy {
    @Input()
    public data: DataEntrySource;

    /** Stream of ValidationResponse for current document */
    public validation = new ReplaySubject<ValidationResponse>(1);

    /** Default view mode. */
    @Input()
    public viewMode = ViewMode.Code;

    /** Flag to indicate the document is loading */
    private isLoading = true;

    /** Flag for showing reformat prompt on GUI switch */
    private showReformatPrompt = true;

    /** Flag for bottom panel, shows validation-issues, commandline, or neither */
    //@todo(maya) consider using ct-panel-switcher instead
    private bottomPanel: "validation" |"commandLineTool" | null;

    /** Flag for validity of CWL document */
    private isValidCWL = false;

    /** Stream of contents in code editor */
    private rawEditorContent = new BehaviorSubject("");

    /** Model that's recreated on document change */
    private toolModel = new CommandLineToolModel("document");

    /** Sorted array of resulting command line parts */
    private commandLineParts: CommandLinePart[];

    private __modes = ViewMode;

    private toolGroup: FormGroup;

    @ViewChild("inspector", {read: ViewContainerRef})
    private inspectorHostView: ViewContainerRef;

    @Input()
    public showInspector = false;

    constructor(private webWorkerService: WebWorkerService,
                private userPrefService: UserPreferencesService,
                private formBuilder: FormBuilder,
                private platform:PlatformAPI,
                private inspector: EditorInspectorService,
                private modal: ModalService) {

        super();

        this.toolGroup = formBuilder.group({});

        this.tracked = this.userPrefService.get("show_reformat_prompt", true, true).subscribe(x => this.showReformatPrompt = x);

        this.tracked = this.inspector.inspectedObject.map(obj => obj !== undefined)
            .subscribe(show => this.showInspector = show);

    }

    ngOnInit(): void {
        // Whenever the editor content is changed, validate it using a JSON Schema.
        this.tracked = this.rawEditorContent
            .skip(1)
            .distinctUntilChanged()
            .subscribe(latestContent => {
                this.webWorkerService.validateJsonSchema(latestContent);
            });

        // Whenever content of a file changes, forward the change to the raw editor content steam.
        this.tracked = this.data.content.subscribe(val => {
            this.rawEditorContent.next(val);
        });

        /**
         * Track validation results.
         * If content is not valid CWL, show the code.
         * If it's a valid CWL, parse it into a model, and show the GUI mode on first load.
         */
        this.tracked = this.webWorkerService.validationResultStream.map(r => {
            if (!r.isValidCwl) {
                // turn off loader and load document as code
                this.isLoading = false;
                return r;
            }

            // load JSON to generate model
            let json = Yaml.safeLoad(this.rawEditorContent.getValue(), {
                json: true
            } as LoadOptions);

            // should show prompt, but json is already reformatted
            if (this.showReformatPrompt && json["rbx:modified"]) {
                this.showReformatPrompt = false;
            }

            // generate model and get command line parts
            this.toolModel        = new CommandLineToolModel("document", json);
            this.commandLineParts = this.toolModel.getCommandLineParts();

            // update validation stream on model validation updates
            this.toolModel.setValidationCallback((res: Validation) => {
                this.validation.next({
                    errors: res.errors,
                    warnings: res.warnings,
                    isValidatableCwl: true,
                    isValidCwl: true,
                    isValidJSON: true
                });
            });

            this.toolModel.validate();

            // load document in GUI and turn off loader, only if loader was active
            if (this.isLoading) {
                this.viewMode  = ViewMode.Gui;
                this.isLoading = false;
            }

            return {
                errors: this.toolModel.validation.errors,
                warnings: this.toolModel.validation.warnings,
                isValidatableCwl: true,
                isValidCwl: true,
                isValidJSON: true
            };

        }).subscribe(this.validation);

        this.tracked = this.validation.subscribe(err => {
            this.isValidCWL = err.isValidCwl;
        });
    }

    private save() {
        const text = this.toolGroup.dirty ? this.getModelText() : this.rawEditorContent.getValue();

        // For local files, just save and that's it
        if (this.data.data.source === "local"){
            this.data.data.save(text).subscribe(noop);
            return;
        }

        // For Platform files, we need to ask for a revision note
        this.modal.prompt({
            cancellationLabel: "Cancel",
            confirmationLabel: "Publish",
            content: "Revision Note",
            title: "Publish a new App Revision",
            formControl: new FormControl('')
        }).then(revisionNote => {
            this.data.save(JSON.parse(text), revisionNote).subscribe(result => {
                const cwl = JSON.stringify(result.message, null , 4);
                this.rawEditorContent.next(cwl);
            });
        }, noop);

    }

    /**
     * Toggles between GUI and Code view. If necessary, it will show a prompt about reformatting
     * when switching to GUI view.
     *
     * @param view
     */
    private switchView(view: ViewMode) {

        if (view === ViewMode.Gui) {

            if (this.showReformatPrompt) {
                this.modal.checkboxPrompt({
                    title: "Confirm GUI Formatting",
                    content: "Activating GUI mode might change the formatting of this document. Do you wish to continue?",
                    cancellationLabel: "Cancel",
                    confirmationLabel: "OK",
                    checkboxLabel: "Don't show this dialog again",
                }).then(res => {
                    if (res) this.userPrefService.put("show_reformat_prompt", false);

                    this.showReformatPrompt = false;
                    this.viewMode           = view;
                }, noop);

            } else {
                this.viewMode = view;
            }
        } else if (view === ViewMode.Code) {
            if (this.toolGroup.dirty) {
                this.rawEditorContent.next(this.getModelText());
            }

            this.viewMode = view;
        }
    }

    /**
     * Serializes model to text. It also adds rbx:modified flag to indicate
     * the text has been formatted by the GUI editor
     */
    private getModelText(): string {
        const modelObject = Object.assign(this.toolModel.serialize(), {"rbx:modified": true});

        return this.data.language.value === "json" ? JSON.stringify(modelObject, null, 4) : Yaml.dump(modelObject);
    }

    /**
     * Toggles the status bar panels
     * @param panel
     */
    private selectBottomPanel(panel: "validation"|"commandLineTool") {
        this.bottomPanel = this.bottomPanel === panel ? null : panel;
    }

    private openRevision(revisionNumber: number) {
        this.platform.getAppCWL(this.data.data, revisionNumber).subscribe(cwl => {
           this.rawEditorContent.next(cwl);
        });
    }

    ngAfterViewInit() {
        this.inspector.setHostView(this.inspectorHostView);
        super.ngAfterViewInit();
    }

}

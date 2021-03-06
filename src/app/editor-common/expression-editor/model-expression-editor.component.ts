import {Component, Input, Output, ViewEncapsulation} from "@angular/core";
import {SBDraft2ExpressionModel} from "cwlts/models/d2sb";
import {ReplaySubject, Subject} from "rxjs";

@Component({
    encapsulation: ViewEncapsulation.None,

    selector: "ct-model-expression-editor",
    template: `
        <ct-expression-editor [evaluator]="evaluator"
                              [context]="context"
                              (action)="action.next($event)"
                              [editorContent]="rawCode"
                              [readonly]="readonly">
        </ct-expression-editor>
    `
})
export class ModelExpressionEditorComponent {

    @Input()
    public model: SBDraft2ExpressionModel;

    @Input()
    public context: { $job?: any, $self?: any };

    @Input()
    public readonly = false;

    @Output()
    public action = new Subject<"close" | "save">();

    public rawCode = new ReplaySubject<string>();

    public evaluator: (code: string) => Promise<string>;

    ngOnInit() {
        this.rawCode.next(this.model.getScript() || "");

        this.evaluator = (content: string) => {

            // this.model = new ExpressionModel(this.model.loc, this.model.serialize());
            this.model.setValue(content, "expression");

            return this.model.evaluate(this.context).then(res => {
                return JSON.stringify(res, null, 4) || "";
            }, err => {
                return err.message + " on " + err.loc;
            });
        }
    }
}

import {Component, forwardRef, Input, OnInit, Output, ViewEncapsulation} from "@angular/core";
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {SBDraft2ExpressionModel} from "cwlts/models/d2sb";
import {ComponentBase} from "../../../components/common/component-base";
import {noop} from "../../../lib/utils.lib";
import {AsyncSubject} from "rxjs";
import {Expression} from "cwlts/mappings/d2sb/Expression";
import {ModalService} from "../../../components/modal/modal.service";

@Component({
    encapsulation: ViewEncapsulation.None,

    selector: "ct-quick-pick",
    styleUrls: ["./quick-pick.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => QuickPickComponent),
            multi: true
        }
    ],
    template: `
        <div class="suggestions" *ngIf="!showCustom">

            <div class="radio-container" *ngFor="let item of list">
                <input type="radio"
                       [class.selected]="computedVal === item.value"
                       [value]="item.value"
                       [formControl]="radioForm"
                       id="{{item.label}}"
                       required>

                <label class="radio-label btn btn-secondary"
                       for="{{item.label}}"
                       [class.selected]="computedVal === item.value">
                    {{ item.label }}
                </label>
            </div>
        </div>

        <button type="button"
                class="btn btn-primary"
                *ngIf="!showCustom && !readonly"
                (click)="createControl('')">Custom
        </button>

        <div *ngIf="showCustom" class="removable-form-control">
            <ct-expression-input [context]="context"
                                 [formControl]="customControl"
                                 [readonly]="readonly"
                                 [type]="type">
            </ct-expression-input>

            <span class="remove-icon" (click)="removeControl($event)">
            <i *ngIf="!readonly" [ct-tooltip]="'Delete'" class="fa fa-trash text-hover-danger"></i>
        </span>
        </div>
    `
})
export class QuickPickComponent extends ComponentBase implements ControlValueAccessor, OnInit {

    @Input()
    public readonly = false;

    @Input()
    public suggestions: { [label: string]: string | number } | string[];

    @Input()
    public context: any;

    @Input()
    public type: "string" | "number" = "string";

    @Output()
    public update = new AsyncSubject<any>();

    public showCustom = false;

    public list: { label: string, value: string | number }[] = [];

    public customControl: FormControl;

    private onTouch = noop;

    private onChange = noop;

    public computedVal: number | string | Expression;

    public radioForm: FormControl;

    get value(): string | number | SBDraft2ExpressionModel {
        return this._value;
    }

    set value(value: string | number | SBDraft2ExpressionModel) {
        this.onChange(value);
        this._value = value;
        let val = value;

        if (value instanceof SBDraft2ExpressionModel && value.type !== "expression") {
            val = <string | number>value.serialize();
        }

        if (this.list && val !== "" && val !== null && val !== undefined) {
            this.showCustom = !this.list.filter(item => {
                return item.value === val;
            }).length;
        } else {
            if (this.customControl) this.removeControl();
            this.showCustom = false;
        }

        this.computedVal = <string | number> val;

        this.radioForm = new FormControl(this.computedVal);
        this.radioForm.valueChanges.subscribe(value => {
            if (!this.readonly) {
                this.setValue(value);
            }
        });

        if (this.showCustom) this.createControl(value);
    }

    private _value: string | number | SBDraft2ExpressionModel;

    private setValue(val: string | number) {
        this.onTouch();
        this.computedVal = val;
        if (this._value instanceof SBDraft2ExpressionModel) {
            this.value = new SBDraft2ExpressionModel("", val);
        } else {
            this.value = val;
        }
    }

    constructor(private modal: ModalService) {
        super();
    }

    ngOnInit() {
        if (this.suggestions) {
            if (Array.isArray(this.suggestions)) {
                const type = typeof this.suggestions[0];
                if (type !== "string") {
                    console.warn(`Please provide ct-quick-pick with correct suggested value format. Expected "string" got "${type}"`)
                } else {
                    (<string[]>this.suggestions).forEach(item => {
                        this.list = this.list.concat([{label: item, value: item}]);
                    });
                }
            } else {
                this.list = Object.keys(this.suggestions).map(key => {
                    return {
                        label: key,
                        value: this.suggestions[key]
                    }
                });
            }
        } else {
            console.warn(`Please provide ct-quick-pick with a list of suggested values
available types: {[label: string]: string | number} | string[]`)
        }
    }

    writeValue(value: string | number | SBDraft2ExpressionModel): void {
        if (this.value !== value) {
            this.value = value;
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouch = fn;
    }

    private createControl(value: number | string | SBDraft2ExpressionModel): void {
        this.customControl = new FormControl(value);
        this.showCustom = true;

        if (!this.readonly) {
            this.tracked = this.customControl.valueChanges
                .subscribe((value: any) => {
                    this.onTouch();
                    this.value = value;
                });
        }
    }

    private removeControl(event?: Event): void {
        if (!!event) {
            event.stopPropagation();
            this.modal.confirm({
                title: "Really Remove?",
                content: `Are you sure that you want to remove this custom resource?`,
                cancellationLabel: "No, keep it",
                confirmationLabel: "Yes, remove it"
            }).then(() => {
                this.removeFunction();
            }, noop);
        } else {
            this.removeFunction();
        }
    }

    private removeFunction() {
        if (this.customControl) {
            this.computedVal = "";
            this.showCustom = false;
            this.customControl = undefined;

            if (this._value instanceof SBDraft2ExpressionModel) {
                this.value = new SBDraft2ExpressionModel("", "");
            } else {
                this.value = "";
            }
        }
    }
}

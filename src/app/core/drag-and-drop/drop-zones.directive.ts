import {Directive, ElementRef, Input} from "@angular/core";
import {ComponentBase} from "../../components/common/component-base";

@Directive({selector: "[ct-drop-zones]"})
export class DropZones extends ComponentBase {

    @Input("ct-drop-zones")
    set dropZones(zones: string[]) {
        this.el.setAttribute("ct-drop-zones", zones.toString());
    }

    public el: Element;

    constructor(el: ElementRef) {
        super();
        this.el = el.nativeElement;
    }
}

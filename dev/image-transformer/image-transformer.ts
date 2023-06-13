import {ResizeOptions, Sharp, SharpOptions} from "sharp";
//Required must be removed as it fails other processes even when they are not using image transformer
// const sharp = require(`sharp`);
import * as fs from "fs-extra";
import * as path from "path";

export type allowedSuffixOptions = `none` | `dimensions` | `widthOnly` | `heightOnly`

export type resizerSaveOptions = {
    suffix?: allowedSuffixOptions
    separator?: string
}

export type imageOption = {
    w?: number,
    h?: number,
    o?: ResizeOptions
}

export type imageToSave = imageOption & {
    image: Sharp
}

// export class Resizer {
//     private readonly origin: string;
//     private readonly originExtension: string;
//     private readonly sharpOptions: SharpOptions;
//     private readonly resizeOptions: ResizeOptions;
//     private readonly imagesToSave: imageToSave[];
//
//     private calculateNewDimensions(ow: number, oh: number, nw: number, nh: number): number[] {
//         if (!ow || !oh) throw `Original image width or height could not have been retrieved!`;
//
//         if (nw && !nh) return [nw, Math.round(oh/(ow/nw))]
//         else if (nh && !nw) return [Math.round(ow/(oh/nh)), nh]
//         else if (!nh && !nw) throw `Width and height are not defined for image resizing!`
//
//         return [nw, nh]
//     }
//
//     private async generateSuffix(imageToSave: imageToSave, option?: allowedSuffixOptions): Promise<string> {
//         let result = ``;
//
//         const metadata = await imageToSave.image.metadata()
//         const nd = this.calculateNewDimensions(metadata.width || 0, metadata.height || 0, imageToSave.w || 0, imageToSave.h || 0)
//
//         if (option === "dimensions") {
//             result = `${nd[0]}x${nd[1]}`
//         }
//         else if (option === "widthOnly") result = `${nd[0]}`
//         else if (option === "heightOnly") result = `${nd[1]}`
//
//         return result
//     }
//
//     resize(images: imageOption[]) {
//         for (const image of images) {
//             if (!image.w && !image.h) throw `In order to resize the image, either width or height (or both) need to be set. Got "${image.w}"x"${image.h}"`;
//             image.o = image.o || {}
//
//             if (image.w)             image.o.width =      image.w
//             if (image.h)             image.o.height =     image.h
//             if (image.w && image.h)  image.o.fit =       `fill`
//
//             this.imagesToSave.push({
//                 w:          image.w,
//                 h:          image.h,
//                 o:          image.o,
//                 image:      sharp(this.origin, this.sharpOptions).resize(image.o)
//             })
//         }
//     }
//
//     async save(loc: string, options?: resizerSaveOptions): Promise<string[]> {
//         const results: string[] = [];
//         const parsedLoc = path.parse(loc);
//         if (parsedLoc.ext === ``) throw `Invalid file name "${parsedLoc.base}" provided!`;
//         if (!fs.existsSync(parsedLoc.dir)) throw `Cannot save the file as location "${parsedLoc.dir}" does not exist!`;
//
//         let separator = options?.separator || ``;
//
//         for (const i of this.imagesToSave) {
//             const loc = path.join(parsedLoc.dir, `${parsedLoc.name}${separator}${await this.generateSuffix(i, options?.suffix)}${parsedLoc.ext}`);
//             await i.image.toFile(loc)
//             results.push(loc)
//         }
//
//         return results
//     }
//
//     constructor(origin: string, options?: {sharpOptions?: SharpOptions}) {
//         this.origin = origin;
//         if (!fs.existsSync(origin)) throw `Cannot initiate a new Resizer as the file "${origin}" does not exist!`;
//         this.originExtension = path.parse(this.origin).ext;
//         this.sharpOptions = options?.sharpOptions || {}
//         this.resizeOptions = {}
//         this.imagesToSave = []
//     }
// }

// const r = new Resizer(`C:\\Users\\service_switch\\Desktop\\Sample Artworks\\Image Resizer Testing\\original.jpeg`);
// r.resize([
//     {w: 300, h: 300},
//     {w: 450},
//     {h: 600},
// ])
// r.save(`C:\\Users\\service_switch\\Desktop\\Sample Artworks\\Image Resizer Testing\\new.jpeg`, {suffix: `dimensions`, separator: `_`}).then(()=>{
//     console.log(`Resized!`);
// })
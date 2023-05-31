"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resizer = void 0;
const sharp = require(`sharp`);
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class Resizer {
    origin;
    originExtension;
    sharpOptions;
    resizeOptions;
    imagesToSave;
    calculateNewDimensions(ow, oh, nw, nh) {
        if (!ow || !oh)
            throw `Original image width or height could not have been retrieved!`;
        if (nw && !nh)
            return [nw, Math.round(oh / (ow / nw))];
        else if (nh && !nw)
            return [Math.round(ow / (oh / nh)), nh];
        else if (!nh && !nw)
            throw `Width and height are not defined for image resizing!`;
        return [nw, nh];
    }
    async generateSuffix(imageToSave, option) {
        let result = ``;
        const metadata = await imageToSave.image.metadata();
        const nd = this.calculateNewDimensions(metadata.width || 0, metadata.height || 0, imageToSave.w || 0, imageToSave.h || 0);
        if (option === "dimensions") {
            result = `${nd[0]}x${nd[1]}`;
        }
        else if (option === "widthOnly")
            result = `${nd[0]}`;
        else if (option === "heightOnly")
            result = `${nd[1]}`;
        return result;
    }
    resize(images) {
        for (const image of images) {
            if (!image.w && !image.h)
                throw `In order to resize the image, either width or height (or both) need to be set. Got "${image.w}"x"${image.h}"`;
            image.o = image.o || {};
            if (image.w)
                image.o.width = image.w;
            if (image.h)
                image.o.height = image.h;
            if (image.w && image.h)
                image.o.fit = `fill`;
            this.imagesToSave.push({
                w: image.w,
                h: image.h,
                o: image.o,
                image: sharp(this.origin, this.sharpOptions).resize(image.o)
            });
        }
    }
    async save(loc, options) {
        const parsedLoc = path.parse(loc);
        if (parsedLoc.ext === ``)
            throw `Invalid file name "${parsedLoc.base}" provided!`;
        if (!fs.existsSync(parsedLoc.dir))
            throw `Cannot save the file as location "${parsedLoc.dir}" does not exist!`;
        let separator = options?.separator || ``;
        for (const i of this.imagesToSave) {
            console.log(await this.generateSuffix(i, options?.suffix));
            await i.image.toFile(path.join(parsedLoc.dir, `${parsedLoc.name}${separator}${await this.generateSuffix(i, options?.suffix)}${parsedLoc.ext}`));
        }
    }
    constructor(origin, options) {
        this.origin = origin;
        if (!fs.existsSync(origin))
            throw `Cannot initiate a new Resizer as the file "${origin}" does not exist!`;
        this.originExtension = path.parse(this.origin).ext;
        this.sharpOptions = options?.sharpOptions || {};
        this.resizeOptions = {};
        this.imagesToSave = [];
    }
}
exports.Resizer = Resizer;
// const r = new Resizer(`C:\\Users\\service_switch\\Desktop\\Sample Artworks\\Image Resizer Testing\\original.jpeg`);
// r.resize([
//     {w: 300, h: 300},
//     {w: 450},
//     {h: 600},
// ])
// r.save(`C:\\Users\\service_switch\\Desktop\\Sample Artworks\\Image Resizer Testing\\new.jpeg`, {suffix: `dimensions`, separator: `_`}).then(()=>{
//     console.log(`Resized!`);
// })

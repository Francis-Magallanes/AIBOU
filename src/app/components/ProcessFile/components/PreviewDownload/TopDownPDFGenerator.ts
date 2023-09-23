import jsPDF from "jspdf";

export {
	type TopDownPDFConfig,
	type MarginsInInches,
	type RectangleSpecsInInches,
	type FontConfig,
	type List,
	type UnorderedList,
	type OrderedList,
	TopDownPDFGenerator,
};

interface TopDownPDFConfig {
	format: "letter" | "legal" | "a4" | RectangleSpecsInInches;
	orientation: "p" | "portrait" | "l" | "landscape";
	margins: "normal" | "narrow" | MarginsInInches;
	fontConfig?: FontConfig;
}

interface MarginsInInches {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

interface RectangleSpecsInInches {
	width: number;
	height: number;
}

interface Coordinate {
	x: number;
	y: number;
}

interface FontConfig {
	fontEmphasis?: "normal" | "bold" | "bolditalic" | "italic";
	fontStyle?: "times" | "helvetica" | "courier";
	fontSizeInPt?: number;
}

type List = OrderedList | UnorderedList;

interface OrderedList {
	readonly type: "ordered";
	indexCharacter: "num" | "alphabet";
	items: (string | UnorderedList | OrderedList)[];
}

interface UnorderedList {
	readonly type: "unordered";
	indexCharacter: "*" | "-" | ">";
	items: (string | UnorderedList | OrderedList)[];
}

// TODO: Adjust the implementation to account for page overflow of text wrapping

/**
 * This class is a facade for jsPDF's complex formatting of text.
 * The placement of text will follow a top down sequence.
 *
 * Take note of the following assumption made in creating this class:
 *  1. unit of measurement used is inches
 *  2. page size, orientation, and its margin is consistent among pages
 *
 * The class have the following capablities:
 *  a. text alignment (right, center, left, justified) and text wrapping
 *  b. applying different font style, font size, and font emphasis to the text
 *  c. creating a list (ordered and unordered)
 *
 */
class TopDownPDFGenerator {
	private pdf: jsPDF;
	private margins!: MarginsInInches;
	private fontConfig: FontConfig;
	private cursor: Coordinate;
	private pageDimensions: RectangleSpecsInInches;

	private readonly indentationSizeInInches = 0.3;

	constructor(config: TopDownPDFConfig) {
		this.fontConfig = {
			fontEmphasis: config.fontConfig?.fontEmphasis ?? "normal",
			fontStyle: config.fontConfig?.fontStyle ?? "times",
			fontSizeInPt: config.fontConfig?.fontSizeInPt ?? 12,
		};

		if (typeof config.margins === "string") {
			if (config.margins === "normal") {
				this.margins = { top: 1, bottom: 1, left: 1, right: 1 };
			} else if (config.margins === "narrow") {
				this.margins = { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 };
			}
		} else {
			this.margins = config.margins;
		}

		this.cursor = { x: this.margins.left, y: this.margins.top };

		this.pdf = new jsPDF({
			format: typeof config.format === "object" ? Object.values(config.format) : config.format,
			orientation: config.orientation,
			unit: "in",
		});

		this.pageDimensions = {
			width: this.pdf.internal.pageSize.width,
			height: this.pdf.internal.pageSize.height,
		};

		this.setFontConfig(this.fontConfig);
	}

	public setFontConfig(config: FontConfig) {
		this.pdf.setFont(
			config.fontStyle ?? this.fontConfig.fontStyle!,
			config.fontEmphasis ?? this.fontConfig.fontEmphasis
		);
		this.pdf.setFontSize(config.fontSizeInPt ?? this.fontConfig.fontSizeInPt!);
	}

	/**
	 * It will append the input text to the pdf document. It will occupy the allowable
	 * "writing" space in the pdf before wrapping the text. Also, next append will occur
	 * below the previous appended text.
	 *
	 * @param text text to be placed in the document
	 * @param alignment aligment of the text
	 */
	public appendText(text: string, alignment?: "right" | "left" | "center" | "justify") {
		const allowableWritingSpaceWidth =
			this.pageDimensions.width - (this.margins.right + this.margins.left);

		if (alignment === "center") {
			const targetXForCenter = this.pdf.internal.pageSize.width / 2;
			this.pdf.text(text, targetXForCenter, this.cursor.y, {
				align: alignment,
				maxWidth: allowableWritingSpaceWidth,
			});
		} else {
			this.pdf.text(text, this.cursor.x, this.cursor.y, {
				align: alignment,
				maxWidth: allowableWritingSpaceWidth,
			});
		}

		const lineHeight = this.pdf.getLineHeight() / this.pdf.internal.scaleFactor;
		const resultingBlockTextHeight =
			(this.pdf.splitTextToSize(text, allowableWritingSpaceWidth) as any[]).length * lineHeight;

		this.cursor.y += resultingBlockTextHeight + lineHeight;
		this.cursor.x = this.margins.right;
	}

	/**
	 * It will append the list into the pdf with appropraite indentation.
	 * Also, next append will occur below the previous appended text.
	 *
	 * @param list list to be put in the pdf
	 */
	public appendList(list: List, alignment?: "right" | "left" | "center" | "justify") {
		if (list.type === "ordered") {
			this.processOrderedList(list, this.cursor.x, alignment);
		} else if (list.type === "unordered") {
			this.processUnorderedList(list, this.cursor.x, alignment);
		}
	}

	private processOrderedList(
		list: OrderedList,
		xPos: number,
		alignment?: "right" | "left" | "center" | "justify"
	) {
		let charIndex = "";
		if (list.indexCharacter === "num") {
			charIndex = "1";
		} else if (list.indexCharacter === "alphabet") {
			charIndex = "a";
		}
		const allowableWritingSpaceWidth =
			this.pageDimensions.width -
			(this.margins.right + this.margins.left) -
			(xPos - this.margins.left);

		for (let i = 0; i < list.items.length; i++) {
			const item = list.items[i];

			if (typeof item === "string") {
				const itemWithIndex = charIndex + ". " + item;

				this.pdf.text(itemWithIndex, xPos, this.cursor.y, {
					align: alignment,
					maxWidth: allowableWritingSpaceWidth,
				});

				const lineHeight = this.pdf.getLineHeight() / this.pdf.internal.scaleFactor;
				const resultingBlockTextHeight =
					(this.pdf.splitTextToSize(itemWithIndex, allowableWritingSpaceWidth) as any[]).length *
					lineHeight;

				this.cursor.y += resultingBlockTextHeight;

				if (list.indexCharacter === "num") {
					charIndex = (Number(charIndex) + 1).toString();
				} else if (list.indexCharacter === "alphabet") {
					charIndex = String.fromCharCode(charIndex.charCodeAt(0) + 1);
				}
			} else if (typeof item === "object") {
				if (item.type === "ordered") {
					this.processOrderedList(item, xPos + this.indentationSizeInInches, alignment);
				} else if (item.type === "unordered") {
					this.processUnorderedList(item, xPos + this.indentationSizeInInches, alignment);
				}
			}
		}
	}

	private processUnorderedList(
		list: UnorderedList,
		xPos: number,
		alignment?: "right" | "left" | "center" | "justify"
	) {
		const charIndex: string = list.indexCharacter;

		const allowableWritingSpaceWidth =
			this.pageDimensions.width -
			(this.margins.right + this.margins.left) -
			(xPos - this.margins.left);

		for (let i = 0; i < list.items.length; i++) {
			const item = list.items[i];

			if (typeof item === "string") {
				const itemWithIndex = charIndex + " " + item;

				this.pdf.text(itemWithIndex, xPos, this.cursor.y, {
					align: alignment,
					maxWidth: allowableWritingSpaceWidth,
				});

				const lineHeight = this.pdf.getLineHeight() / this.pdf.internal.scaleFactor;
				const resultingBlockTextHeight =
					(this.pdf.splitTextToSize(itemWithIndex, allowableWritingSpaceWidth) as any[]).length *
					lineHeight;

				this.cursor.y += resultingBlockTextHeight;
			} else if (typeof item === "object") {
				if (item.type === "ordered") {
					this.processOrderedList(item, xPos + this.indentationSizeInInches, alignment);
				} else if (item.type === "unordered") {
					this.processUnorderedList(item, xPos + this.indentationSizeInInches, alignment);
				}
			}
		}
	}

	public output(): jsPDF {
		return this.pdf;
	}

	public addPageAndFocusThatPage() {
		this.pdf.addPage();
		this.cursor.x = this.margins.left;
		this.cursor.y = this.margins.right;
	}
}

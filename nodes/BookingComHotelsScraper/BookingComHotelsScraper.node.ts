import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import type { OptionField } from './GenericFunctions';
import { applyOptions, requireString, runActorAndGetItems } from './GenericFunctions';

// ScrapeUnblocker's public "Booking.com Hotels Scraper" Actor: https://apify.com/scrapeunblocker/booking-scraper
const ACTOR_ID = '8gUwa0LCAUobP8bEI';
const INTEGRATION_APP_ID = 'scrapeunblocker-booking-scraper';

// Node option name -> Actor input key.
const OPTION_FIELDS: Record<string, OptionField> = {
	checkin: {
		key: 'checkin',
	},
	checkout: {
		key: 'checkout',
	},
	adults: {
		key: 'adults',
	},
	children: {
		key: 'children',
	},
	rooms: {
		key: 'rooms',
	},
	currency: {
		key: 'currency',
	},
	proxyCountry: {
		key: 'proxy_country',
		kind: 'upper',
	},
};

function buildActorInput(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	options: IDataObject,
	itemIndex: number,
): IDataObject {
	const input: IDataObject = {};

	switch (`${resource}:${operation}`) {
		case 'hotel:search': {
			input.location = requireString.call(this, 'location', 'Location', itemIndex);
			input.max_results = this.getNodeParameter('maxResults', itemIndex);
			break;
		}
		default:
			throw new NodeOperationError(
				this.getNode(),
				`The operation "${operation}" is not supported for resource "${resource}"`,
				{ itemIndex },
			);
	}

	applyOptions(input, options, OPTION_FIELDS);
	return input;
}

export class BookingComHotelsScraper implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Booking.com Hotels Scraper',
		name: 'bookingComHotelsScraper',
		icon: {
			light: 'file:bookingComHotelsScraper.png',
			dark: 'file:bookingComHotelsScraper.dark.png',
		},
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Search Booking.com hotels and properties by city, dates and guests with the ScrapeUnblocker Actor on Apify',
		defaults: {
			name: 'Booking.com Hotels Scraper',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'apifyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Hotel',
						value: 'hotel',
					},
				],
				default: 'hotel',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['hotel'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						description: 'Search Booking.com properties in a city or place',
						action: 'Search hotels',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Paris',
				description: "City or place to search, e.g. 'Austin' or 'Paris'",
				displayOptions: {
					show: {
						resource: ['hotel'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Max Results',
				name: 'maxResults',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 500,
				},
				default: 50,
				description: 'How many properties to collect across pages (1-500)',
				displayOptions: {
					show: {
						resource: ['hotel'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Adults',
						name: 'adults',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 2,
						description: 'Number of adults',
					},
					{
						displayName: 'Check-In Date',
						name: 'checkin',
						type: 'string',
						default: '',
						placeholder: '2026-11-12',
						description:
							'Check-in date as YYYY-MM-DD. Set it together with Check-Out Date to get prices.',
					},
					{
						displayName: 'Check-Out Date',
						name: 'checkout',
						type: 'string',
						default: '',
						placeholder: '2026-11-15',
						description: 'Check-out date as YYYY-MM-DD',
					},
					{
						displayName: 'Children',
						name: 'children',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description: 'Number of children',
					},
					{
						displayName: 'Currency',
						name: 'currency',
						type: 'options',
						options: [
							{
								name: 'AED',
								value: 'AED',
							},
							{
								name: 'AUD',
								value: 'AUD',
							},
							{
								name: 'BRL',
								value: 'BRL',
							},
							{
								name: 'CAD',
								value: 'CAD',
							},
							{
								name: 'CHF',
								value: 'CHF',
							},
							{
								name: 'CNY',
								value: 'CNY',
							},
							{
								name: 'EUR',
								value: 'EUR',
							},
							{
								name: 'GBP',
								value: 'GBP',
							},
							{
								name: 'INR',
								value: 'INR',
							},
							{
								name: 'JPY',
								value: 'JPY',
							},
							{
								name: 'MXN',
								value: 'MXN',
							},
							{
								name: 'PLN',
								value: 'PLN',
							},
							{
								name: 'SEK',
								value: 'SEK',
							},
							{
								name: 'SGD',
								value: 'SGD',
							},
							{
								name: 'USD',
								value: 'USD',
							},
						],
						default: 'USD',
						description: 'Currency of the prices',
					},
					{
						displayName: 'Proxy Country',
						name: 'proxyCountry',
						type: 'string',
						default: '',
						placeholder: 'US',
						description: 'Exit-IP country (ISO-2, e.g. US). Leave blank to pick one automatically.',
					},
					{
						displayName: 'Rooms',
						name: 'rooms',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 1,
						description: 'Number of rooms',
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description:
							'Maximum run time of the Apify Actor run. 0 keeps the Actor default. A run that times out fails the node.',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;
				const { timeout, ...actorOptions } = options;

				const input = buildActorInput.call(this, resource, operation, actorOptions, i);
				const { items: results } = await runActorAndGetItems.call(this, {
					actorId: ACTOR_ID,
					integrationAppId: INTEGRATION_APP_ID,
					input,
					itemIndex: i,
					timeoutSecs: (timeout as number) || undefined,
				});

				for (const result of results) {
					returnData.push({ json: result, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				// Both constructors return an error of their own class unchanged.
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject, { itemIndex: i });
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

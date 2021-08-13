importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const LAYER_ID = '60df35cf1f491500087f6f76'
const PERMALINK = 'https://unit4.io'

const typeLabel = new Map([
	['tree', 'Дерево'],
])
const buttonLabel = new Map([
	['tree', 'Добавить'],
])
const colors = new Map([
	['tree', '#4DCCBD'],
])

setup(async () => {
	// const layerId = await requestLayer({
	// 	geometryTypes: ['Point']
	// })
	return {
		name: 'Trees',
		version: '1.0.0',
		description: 'survey',
		// options: {
		// 	layerId,
		// }
	}
})

on('install', async event => {
	overlay([
		// ['@', 'top-left', [
		//     ['button', { icon: 'arrow-left', href: PERMALINK }],
		//     // ['html', {
		//     //     html: '<a style="background:white;padding:2px 5px;" href="https://берегурай.рф">← на сайт берегурай.рф</a>',
		//     // }],
		// ]],
		// ['@', 'top-center', [
		//     ['html', { html: '<h1 style="margin:0;">ПИТКЯРАНТА</h1>' }],
		// ]],
		['@', 'right-center', [
			['button', { icon: 'question', command: 'ShowHelp' }],
		]],
	])

	//showHelp()
})

on('idle', async event => {
	await toolbar([
		['AddTree', {
			label: buttonLabel.get('tree'),
			// icon: 'like',
			color: colors.get('tree'),
		}],
	], {
		foldedLabel: 'Добавить',
	})
})

function mdToHtml(text) {
	const md = new markdownit()
	const tp = new Typograf({ locale: ['ru', 'en-US'] })
	const raw = md.render(text)
	return tp.execute(raw)
}

function getFeaturePopupContent(feature) {
	const type = feature.properties['wood']
	if (!type) {
		return null
	}

	const title = wood

	const kv = [
		['trunk_diameter', 'Обхват ствола на высоте 130 см (см)'],
		['height', 'Высота (м)'],
		['crown_diameter', 'Диаметр кроны (м)'],
		['condition', 'Состояние'],
		['trunk_support', 'Наличие опоры'],
		['ground', 'Тип поверхности, в которое посажено дерево'],
	].map(([key, label]) => {
		return `${label}: ${feature.properties[key]}`
	})

	return mdToHtml([
		`## ${title}`,
		...kv,
	].join('\n\n'))
}

	on('feature.select', async event => {
	const featureId = event.data.featureId
	const layerId = event.data.layerId
	if (!featureId) {
		return
	}

	const fc = await requestFeatures([featureId])

	const feature = fc.features[0]
	const geometryType = feature.geometry.type
	assert(geometryType !== 'Point', new Error('Selected feature is not a point'))

	// const html = getFeaturePopupContent(feature)
	// if (!html) {
	// 	return
	// }

	const kv = [
		['wood', 'Порода'],
		['trunk_diameter', 'Обхват ствола на высоте 130 см (см)'],
		['height', 'Высота (м)'],
		['crown_diameter', 'Диаметр кроны (м)'],
		['condition', 'Состояние'],
		['trunk_support', 'Наличие опоры'],
		['ground', 'Тип поверхности, в которое посажено дерево'],
	]
	await showMapPopup(feature.geometry.coordinates, ['kv', {
		data: kv
			.map(([key, label]) => {
				let value = feature.properties[key]
				if (Array.isArray(value)) {
					value = value[0]
				}
				return {
					key: label, value,
				}
			})
			.filter(({ value }) => Boolean(value))
	}])
	// await showMapPopup(feature.geometry.coordinates, ['html', {
	// 	html, style: {
	// 		padding: 16,
	// 	}
	// }])
})

command('AddTree', async ctx => {
	return AddFeature({
		type: 'tree',
		title: buttonLabel.get('tree'),
	})
})

command("ShowHelp", () => {
	showHelp()
})

async function showHelp() {
	const html = mdToHtml(`
        # Trees
    `)
	await showPopup([
		['html', { html }]
	], {
		title: 'Help',
		submit: 'Got it',
	})
}

async function AddFeature({ type, title }) {
	const mobile = await requestState('layout.mobile')
	const info = mobile
		? 'Добавьте точку на карте'
		: 'Добавьте точку на карте'
	const info2 = mobile
		? 'Наведите перекрестие и нажмите ОК'
		: 'Кликните по карте'
	const coord = await requestPoint(info2, info)
	// const coord = await requestPoint('Кликни по карте', 'что-то произойдет')

	// const before = !categories ? [] : [
	//     ['category', ['select', { label: 'Категория' },
	//         categories.map(value => ['option', { value }])
	//     ]]
	// ]
	const form = await requestInput([
		['wood', ['select', {
			required: true,
			label: 'Порода',
			mode: 'tags',
		}, [
				['option', { value: 'АБРИКОС' }],
				['option', { value: 'АКАЦИЯ' }],
				['option', { value: 'АЙВА ЯПОНСКАЯ' }],
				['option', { value: 'АРОНИЯ' }],
				['option', { value: 'БАГРЯННИК' }],
				['option', { value: 'БАРБАРИС' }],
				['option', { value: 'БЕРЕЗА' }],
				['option', { value: 'Береза бородавчатая или повислая' }],
				['option', { value: 'Береза бумажная' }],
				['option', { value: 'Береза вишневая' }],
				['option', { value: 'Береза далекарлийкая' }],
				['option', { value: 'Береза черная' }],
				['option', { value: 'Береза американская' }],
				['option', { value: 'Береза мелколистная' }],
				['option', { value: 'Береза полезная' }],
				['option', { value: 'Береза пушистая' }],
				['option', { value: 'Береза ребристая, ' }],
				['option', { value: 'Береза шерстистая' }],
				['option', { value: 'Береза Эрмана' }],
				['option', { value: 'БОБОВНИК' }],
				['option', { value: 'БОЯРЫШНИК' }],
				['option', { value: 'Боярышник алмаатинский' }],
				['option', { value: 'БУЗИНА' }],
				['option', { value: 'БУК' }],
				['option', { value: 'ВИШНЯ' }],
				['option', { value: 'ВЯЗ' }],
				['option', { value: 'Вяз английский' }],
				['option', { value: 'Вяз Андросова' }],
				['option', { value: 'Вяз гладкий' }],
				['option', { value: 'Вяз граболистный' }],
				['option', { value: 'Вяз густой ' }],
				['option', { value: 'Вяз лопастной' }],
				['option', { value: 'Вяз перистоветвистый' }],
				['option', { value: 'Вяз приземистый' }],
				['option', { value: 'Вяз сродный' }],
				['option', { value: 'Вяз шершавый' }],
				['option', { value: 'ГИНКГО' }],
				['option', { value: 'ГЛЕДИЧИЯ' }],
				['option', { value: 'ГЛИЦИНИЯ' }],
				['option', { value: 'ГРАБ' }],
				['option', { value: 'ГРУША' }],
				['option', { value: 'ДУБ' }],
				['option', { value: 'Дуб белый' }],
				['option', { value: 'Дуб болотный' }],
				['option', { value: 'Дуб иволистный' }],
				['option', { value: 'Дуб каменный' }],
				['option', { value: 'Дуб каштанолистный' }],
				['option', { value: 'Дуб красный или северный' }],
				['option', { value: 'Дуб крупноплодный' }],
				['option', { value: 'Дуб крупнопыльниковый' }],
				['option', { value: 'Дуб монгольский' }],
				['option', { value: 'Дуб пробковый' }],
				['option', { value: 'Дуб пушистый' }],
				['option', { value: 'Дуб скальный' }],
				['option', { value: 'Дуб черешчатый' }],
				['option', { value: 'ЗЕМЛЯНИЧНОЕ ДЕРЕВО' }],
				['option', { value: 'ИВА' }],
				['option', { value: 'Ива Бэбба' }],
				['option', { value: 'Ива белая' }],
				['option', { value: 'Ива вавилонская' }],
				['option', { value: 'Ива волчникова' }],
				['option', { value: 'Ива изящнейшая' }],
				['option', { value: 'Ива кангинская' }],
				['option', { value: 'Ива каспийская' }],
				['option', { value: 'Ива козья' }],
				['option', { value: 'Ива ломкая' }],
				['option', { value: 'Ива Матсуды' }],
				['option', { value: 'Ива мохнатая' }],
				['option', { value: 'Ива остролистная' }],
				['option', { value: 'Ива ползучая' }],
				['option', { value: 'Ива прутовидная' }],
				['option', { value: 'Ива пурпурная' }],
				['option', { value: 'Ива пятитычинковая' }],
				['option', { value: 'Ива росистая' }],
				['option', { value: 'Ива ушастая' }],
				['option', { value: 'Ива узколистная' }],
				['option', { value: 'Ива цельнолистная' }],
				['option', { value: 'Ива удская' }],
				['option', { value: 'КАЛЬМИЯ' }],
				['option', { value: 'КАРКАС' }],
				['option', { value: 'КАТАЛЬПА' }],
				['option', { value: 'КАШТАН' }],
				['option', { value: 'Каштан американский' }],
				['option', { value: 'Каштан японский' }],
				['option', { value: 'Каштан европейский' }],
				['option', { value: 'КЛЕН' }],
				['option', { value: 'Клен бородатый' }],
				['option', { value: 'Клен Гиннала' }],
				['option', { value: 'Клен голый' }],
				['option', { value: 'Клен желтый' }],
				['option', { value: 'Клен голый ' }],
				['option', { value: 'Клен завитой' }],
				['option', { value: 'Клен зеленокорый' }],
				['option', { value: 'Клен колосистый' }],
				['option', { value: 'Клен ложнозибольдов' }],
				['option', { value: 'Клен красный' }],
				['option', { value: 'Клен ложноплатановый' }],
				['option', { value: 'Клен маньчжурский' }],
				['option', { value: 'Клен мелколистный' }],
				['option', { value: 'Клен остролистный' }],
				['option', { value: 'Клен пенсильванский' }],
				['option', { value: 'Клен полевой' }],
				['option', { value: 'Клен расходящийся' }],
				['option', { value: 'Клен сахарный' }],
				['option', { value: 'Клен Семенова' }],
				['option', { value: 'Клен серебристый' }],
				['option', { value: 'Клен татарский' }],
				['option', { value: 'Клен черный' }],
				['option', { value: 'Клен ясенелистный' }],
				['option', { value: 'КОНСКИЙ КАШТАН' }],
				['option', { value: 'КРУШИНА' }],
				['option', { value: 'ЛЕЩИНА' }],
				['option', { value: 'ЛИМОННИК' }],
				['option', { value: 'ЛИПА' }],
				['option', { value: 'Липа американская' }],
				['option', { value: 'Липа амурская' }],
				['option', { value: 'Липа войлочная' }],
				['option', { value: 'Липа европейская' }],
				['option', { value: 'Липа кавказская' }],
				['option', { value: 'Липа крупнолистная' }],
				['option', { value: 'Липа Максимовича' }],
				['option', { value: 'Липа маньчжурская' }],
				['option', { value: 'Липа мелколистная' }],
				['option', { value: 'Липа обыкновенная' }],
				['option', { value: 'Липа опушенностолбиковая' }],
				['option', { value: 'Липа островная' }],
				['option', { value: 'Липа сибирская' }],
				['option', { value: 'Липа Таке' }],
				['option', { value: 'Липа темно-зеленая' }],
				['option', { value: 'Липа японская' }],
				['option', { value: 'ЛИРИОДЕНДРОН' }],
				['option', { value: 'ЛОХ' }],
				['option', { value: 'МАГНОЛИЯ' }],
				['option', { value: 'МИНДАЛЬ' }],
				['option', { value: 'МИРТ' }],
				['option', { value: 'ОБЛЕПИХА' }],
				['option', { value: 'ОЛЬХА' }],
				['option', { value: 'ОРЕХ' }],
				['option', { value: 'Орех грецкий' }],
				['option', { value: 'Орех Зибольда' }],
				['option', { value: 'Орех маньчжурский' }],
				['option', { value: 'Орех серый' }],
				['option', { value: 'Орех черный' }],
				['option', { value: 'Орех Хиндса' }],
				['option', { value: 'Орех Ланкастерский' }],
				['option', { value: 'ПАВЛОВНИЯ' }],
				['option', { value: 'ПЛАТАН' }],
				['option', { value: 'Платан восточный или Чинар' }],
				['option', { value: 'Платан западный' }],
				['option', { value: 'Платан кленолистный или лондонский' }],
				['option', { value: 'РОБИНИЯ ' }],
				['option', { value: 'РЯБИНА' }],
				['option', { value: 'СИРЕНЬ' }],
				['option', { value: 'СЛИВА' }],
				['option', { value: 'СОФОРА' }],
				['option', { value: 'ТОПОЛЬ' }],
				['option', { value: 'Тополь бальзамический' }],
				['option', { value: 'Тополь белый' }],
				['option', { value: 'Тополь берлинский' }],
				['option', { value: 'Тополь Болле' }],
				['option', { value: 'Тополь волосистоплодный' }],
				['option', { value: 'Тополь генероза' }],
				['option', { value: 'Тополь дельтовидный' }],
				['option', { value: 'Тополь душистый' }],
				['option', { value: 'Тополь ивантеевский' }],
				['option', { value: 'Тополь канадский' }],
				['option', { value: 'Тополь Комарова' }],
				['option', { value: 'Тополь корейский' }],
				['option', { value: 'Тополь крупнолистный' }],
				['option', { value: 'Тополь Симона' }],
				['option', { value: 'Тополь лавролистный' }],
				['option', { value: 'Тополь Максимовича' }],
				['option', { value: 'Тополь московский' }],
				['option', { value: 'Тополь осинообразный' }],
				['option', { value: 'Тополь пирамидальный' }],
				['option', { value: 'Тополь советский пирамидальный' }],
				['option', { value: 'Тополь черный' }],
				['option', { value: 'Тополь Яблокова' }],
				['option', { value: 'ОСИНА' }],
				['option', { value: 'ЧЕРЕМУХА' }],
				['option', { value: 'ЖАСМИН' }],
				['option', { value: 'ШЕЛКОВИЦА' }],
				['option', { value: 'ЯБЛОНЯ' }],
				['option', { value: 'ЯСЕНЬ' }],
				['option', { value: 'Ясень американский' }],
				['option', { value: 'Ясень белый' }],
				['option', { value: 'Ясень ланцетный' }],
				['option', { value: 'Ясень обыкновенный' }],
				['option', { value: 'Ясень пушистый' }],
				['option', { value: 'Ясень узколистный' }],
				['option', { value: 'Ясень билтморейский' }],
				['option', { value: 'Ясень Бунге' }],
				['option', { value: 'Ясень сплошь волосистый' }],
				['option', { value: 'Ясень маньчжурский' }],
				['option', { value: 'Ясень черный' }],
				['option', { value: 'Ясень орегонский' }],
				['option', { value: 'Ясень остроплодный' }],
				['option', { value: 'Ясень четырехгранный' }],
				['option', { value: 'Ясень носолистный' }],
				['option', { value: 'Ясень согдианский' }],
				['option', { value: 'Ясень сирийский' }],
				['option', { value: 'Ясень войлочный' }],
				['option', { value: 'Ясень бархатный голый' }],
			]
		]],
		['trunk_diameter', ['input', {
			required: true,
			label: 'Обхват ствола на высоте 130 см (см)',
		}]],
		['height', ['input', {
			required: true,
			label: 'Высота (м)',
		}]],
		['crown_diameter', ['input', {
			required: true,
			label: 'Диаметр кроны (м)',
		}]],
		['condition', ['select', {
			required: true,
			label: 'Состояние',
			mode: 'single',
		}, [
				['option', { value: 'Удовлетворительное' }],
				['option', { value: 'Неудовлетворительное' }],
				['option', { value: 'Хорошее' }],
			],
		]],
		['trunk_support', ['select', {
			required: true,
			label: 'Наличие опоры',
			mode: 'single',
		}, [
				['option', { value: 'Есть' }],
				['option', { value: 'Нет' }],
			],
		]],
		['ground', ['select', {
			required: true,
			label: 'Тип поверхности, в которое посажено дерево',
			mode: 'tags',
		}, [
				['option', { value: 'Газон с травой' }],
				['option', { value: 'Газон вытоптанный' }],
				['option', { value: 'Плитка' }],
				['option', { value: 'В квадрате' }],
				['option', { value: 'Открытый грунт' }],
			],
		]],
		['comment', ['text', {
			label: 'Комментарий',
			required: false,
			rows: 6,
		}]],
	], {
		title,
		submit: 'Добавить',
		cancel: 'Отмена',
	})

	const date = new Date()
	const properties = {
		comment: form.comment,
		wood: form.wood,
		trunk_diameter: form.trunk_diameter,
		height: form.height,
		crown_diameter: form.crown_diameter,
		condition: form.condition,
		trunk_support: form.trunk_support,
		ground: form.ground,
		dateAdded: date.toString(),
		type,
	}

	const f = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [coord.lng, coord.lat]
				},
				properties,
			}
		]
	}

	await addFeatures(f, {
		layerId: LAYER_ID,
	})
}

importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const LAYER_ID = '606263eddd79a05fefd4c714'
const PERMALINK = 'https://unit4.io'

const typeLabel = new Map([
    ['smell_low', 'запаха нет или почти нет'],
    ['smell_medium', 'запах ощущается иногда, но заметно мешает'],
    ['smell_high', 'воняет често и сильно'],
])
const buttonLabel = new Map([
    ['smell_low', 'запаха нет или почти нет'],
    ['smell_medium', 'запах ощущается иногда, но заметно мешает'],
    ['smell_high', 'воняет често и сильно'],
])

const colors = new Map([
    ['smell_low', '#4DCCBD'],
    ['smell_medium', '#FFD166'],
    ['smell_high', '#F25C63'],
])

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'VolokolamskBitum',
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

    showHelp()
})

on('idle', async event => {
    await toolbar([
        ['AddLow', {
            label: buttonLabel.get('smell_low'),
            icon: 'smile',
            color: colors.get('smell_low'),
        }],
        ['AddMedium', {
            label: buttonLabel.get('smell_medium'),
            icon: 'meh',
            color: colors.get('smell_medium'),
        }],
        ['AddHigh', {
            label: buttonLabel.get('smell_high'),
            icon: 'frown',
            color: colors.get('smell_high'),
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
    const name = feature.properties['Name']
    if(name){
        return mdToHtml(`## ${name}`)
    }

    const type = feature.properties['type']
    if(!type){
        return null
    }

    const title = typeLabel.get(type)
    const comment = feature.properties['comment']

    return mdToHtml([
        `## ${title}`,
        comment
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

    const html = getFeaturePopupContent(feature)
    if(!html) {
        return
    }

    await showMapPopup(feature.geometry.coordinates, ['html', {
        html, style: {
            padding: 16,
        }
    }])
})

command("AddLow", async ctx => {
    return AddFeature({
        type: 'smell_low',
        title: buttonLabel.get('smell_low'),
        placeholder: 'Комментарий',
        label: 'Комментарий',
        categories: [],
    })
})

command("AddMedium", async ctx => {
    return AddFeature({
        type: 'smell_medium',
        title: buttonLabel.get('smell_medium'),
        placeholder: 'Комментарий',
        label: 'Комментарий',
        categories: [],
    })
})

command("AddHigh", async ctx => {
    return AddFeature({
        type: 'smell_high',
        title: buttonLabel.get('smell_high'),
        placeholder: 'Комментарий',
        label: 'Комментарий',
        categories: [],
    })
})

command("ShowHelp", () => {
    showHelp()
})

async function showHelp() {
    const html = mdToHtml(`
# «Битум. Волоколамск»

Недавно в Волоколамске у ж/д станции открылось после реконструкции старое нефтехранилище - теперь это битумный терминал.

Многие жалуются на вонь, распространяющуюся от него.

Пожалуйста, отметьте карте на месте, где вы проживаете, в какой степени вы ощущаете запах от хранилища.

Постарайтесь быть объективными, не приукрашивать и не закрывать глаза на запах.

Карта нужна для борьбы против выбросов и переговоров с собственниками и властями!

Спасибо за содействие!

С уважением, [включиволоколамск.рф](включиволоколамск.рф)
    `)
    await showPopup([
        ['html', { html }]
    ], {
        title: 'Help',
        submit: 'Got it',
    })
}

async function AddFeature({ type, title, placeholder, label, categories }) {
    const mobile = await requestState('layout.mobile')
    const info = mobile
        ? 'Добавте точку на карте'
        : 'Добавте точку на карте'
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
    const before = []
    const form = await requestInput([
        ...before,

        ['comment', ['text', {
            label,
            placeholder,
            //required: 'Вы забыли оставить коментарий',
            rows: 12,
        }]],
        //['contact', ['input', {
        //    label: 'Присоединяйтесь к проекту, оставьте ваши имя, e-mail, телефон или социальные сети (по желанию)',
        //    placeholder: 'имя, e-mail, телефон, соцсети',
        //    // pattern: {
        //    //        value: /^([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})?$/i,
        //    //        message: "invalid email address"
        //    //    }
        //}]],
    ], {
        title,
        submit: 'Добавить',
        cancel: 'Отмена',
    })

    const date = new Date()
    const properties = {
        comment: form.comment,
        // category: form.category,
        // contact: form.contact,
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


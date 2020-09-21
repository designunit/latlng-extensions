importScripts('https://unpkg.com/typograf@6.11.0/dist/typograf.js')
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/10.0.0/markdown-it.min.js')
importScripts('/latlng.js')

const LAYER_ID = '5f68eb11e4cf7f5235dc6cd3'
const PERMALINK = 'https://unit4.io'

const typeLabel = new Map([
    ['idea', 'Идея'],
    ['problem', 'Проблема'],
    ['nice', 'Ценность'],
])

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'Meleuz',
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
        ['AddIdea', {
            label: 'Предложить идею',
            icon: 'bulb',
            color: '#FFD166',
        }],
        ['AddNice', {
            label: 'Описать ценность',
            icon: 'like',
            color: '#4DCCBD',
        }],
        ['AddProblem', {
            label: 'Описать проблему',
            icon: 'dislike',
            color: '#F25C63',
        }],
    ], {
        foldedLabel: 'Добавить',
    })
})

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

    const type = feature.properties['type']
    const title = typeLabel.get(type)
    const comment = feature.properties['comment']

    const md = new markdownit()
    const raw = md.render([
        `# ${title}`,
        comment
    ].join('\n\n'));

    const tp = new Typograf({ locale: ['ru', 'en-US'] })
    const html = tp.execute(
        raw
    )

    await showMapPopup(feature.geometry.coordinates, ['html', {
        html, style: {
            padding: 16,
        }
    }])
})

command("AddIdea", async ctx => {
    return AddFeature({
        type: 'idea',
        title: 'Идея',
        placeholder: 'Опишите свою идею...',
        label: 'Комментарий',
        categories: null,
    })
})

command("AddProblem", async ctx => {
    return AddFeature({
        type: 'problem',
        title: 'Проблема',
        placeholder: 'Опишите проблему...',
        label: 'Комментарий',
        categories: [
            'Транспорт и дороги',
            'Мусор и загрязнение',
            'Доступная среда',
            'Площадки для отдыха',
            'Озеленение',
            'Безопасность',
            'Визуальный мусор',
            'Шум',
            'Река',
            'Другое',
        ]
    })
})

command("AddNice", async ctx => {
    return AddFeature({
        type: 'nice',
        title: 'Ценность',
        placeholder: 'Расскажите свою историю...',
        label: 'Комментарий',
        categories: [
            'Природа и виды',
            'Воспоминания',
            'Значимые события',
            'Архитектура',
            'Любимые места',
            'Другое',
        ]
    })
})

command("ShowHelp", () => {
    showHelp()
})

async function showHelp() {
    const text = `
# Мелеуз

Поделиться своим мнением просто:
1. Выберите отметку идею, проблему или ценность
2. Укажите точку на карте
3. Выберите категорию
4. Напишите комментарий

**Идеи и предложения:** Что может появиться на территории Мелеузки от ул. Ленина до Центрального рынка? Чего вам здесь не хватает?

**Проблемы:** Что вас беспокоит на реке/рынке/автовокзале и прибрежных территорий.

**Ценности:** Важные и любимые вами элементы, которые нужно сохранить или восстановить (исторические территории, интересные события, растительный и животный мир реки).
	`
    const md = new markdownit()
    const html = md.render(text)

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

    const before = !categories ? [] : [
        ['category', ['select', { label: 'Категория' },
            categories.map(value => ['option', { value }])
        ]]
    ]
    const form = await requestInput([
        ...before,

        ['comment', ['text', {
            label,
            placeholder,
            required: 'Вы забыли оставить коментарий',
            rows: 12,
        }]],
        ['contact', ['input', {
            label: 'Присоединяйтесь к проекту, оставьте ваши имя, e-mail, телефон или социальные сети (по желанию)',
            placeholder: 'имя, e-mail, телефон, соцсети',
            // pattern: {
            //        value: /^([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})?$/i,
            //        message: "invalid email address"
            //    }
        }]],
    ], {
        title,
        submit: 'Добавить',
        cancel: 'Отмена',
    })

    const date = new Date()
    const properties = {
        comment: form.comment,
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


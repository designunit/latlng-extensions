importScripts('/latlng.js')

const SOURCE_ID_TEC = '66a989ad8d63e8000821dcc8'
const SOURCE_ID_VIZ = '66aa66842070bb0008e7d00a'

const rating = [
    ['option', { value: '2' }],
    ['option', { value: '1' }],
    ['option', { value: '0' }],
    ['option', { value: '-1' }],
    ['option', { value: '-2' }],
]

setup(async () => {
    // const layerId = await requestLayer({
    // 	geometryTypes: ['Point']
    // })
    return {
        name: 'app',
        version: '0.0.0',
        description: 'app',
        // options: {
        // 	layerId,
        // }
    }
})

on('install', async event => {
})

on('idle', async event => {
    await toolbar([
        ['AddViz', {
            icon: 'plus',
            label: 'Виз',
            color: '#ff006c',
        }],
        ['AddTec', {
            icon: 'plus',
            label: 'Тех',
            color: '#008fff',
        }],
    ], {
        //foldedLabel: 'Добавить',
    })
})

on('feature.select', async event => {
    const featureId = event.data.featureId
    const sourceId = event.data.layerId
    if (!featureId) {
        return
    }
    const fc = await requestFeatures([featureId])
    if (fc.features.length === 0) {
        return
    }
    const feature = fc.features[0]
    const geometryType = feature.geometry.type
    assert(geometryType !== 'Point', new Error('Selected feature is not a point'))
    
    const exclude = new Set(["id", "dateAdded"])    
    const data = Object
        .keys(feature.properties)
        .filter(key => !exclude.has(key)) // skip excluded records
        .filter(key => feature.properties[key] !== undefined) // take only set values
        .map(key => ({
            key,
            value: ` ${feature.properties[key]} `,
        }))
    await showMapPopup(feature.geometry.coordinates, ['kv', { data }])
})

command("AddViz", async ctx => {
    return AddFeature('Визуально-Эстетический', SOURCE_ID_VIZ, [
        ['Контекст',                         ['select', { label: 'Контекст, окружение (насколько территория, здания вокруг, ландшафт соответствуют друг другу, являются единым целым)' }, rating]],
        ['Колористика фасадов',              ['select', { label: 'Колористика фасадов, объектов окружающих территорию (хаотичность, отсутствие единого образа, единого цветовой палитры)' }, rating]],
        ['Состояние фасадов',                ['select', { label: 'Состояние фасадов и фасадных элементов окружающих территорию (балконы, оконные и дверные заполнения, пристройки)' }, rating]],
        ['Территория',                       ['select', { label: 'Территория, насколько объекты внутри территории соответствуют друг-другу, не диссонируют' }, rating]],
        ['Достаточность освещенности',       ['select', { label: 'Освещение, достаточность освещенности (равномерность освещения всех зон)' }, rating]],
        ['Разнофункциональность освещение',  ['select', { label: 'Освещение, разнофункциональность (наличие разноуровневого, разнофункционального, декоративного освещения)' }, rating]],
        ['Достаточность озеленения',         ['select', { label: 'Озеленение, достаточность (равномерность расперделения озеленения по всей территории, непрерывный зеленый каркас)' }, rating]],
        ['Разнообразие озеленения',          ['select', { label: 'Озеленение, разнообразие (разноуровневое, разных типов, перемешивание типов зеленых насаждений)' }, rating]],
        ['Визуальный мусор',                 ['select', { label: 'Визуальный мусор (реклама, вывески, инженерные коммуникации)' }, rating]],
        ['Признаки вандализма',              ['select', { label: 'Признаки вандализма (тэги / стикеры / графити / сломанные элементы)' }, rating]],
        ['Навигация',                        ['select', { label: 'Навигация, наличие, понятность, интуитивность' }, rating]],
        ['Чистота',                          ['select', { label: 'Чистота (наличие физического мусора, переполненные урны, отсутствие урн)' }, rating]],
        ['Шум',                              ['select', { label: 'Шум (наличие аудиосопровождения, аудиорекламы, постоянно играющей музыки и тд)' }, rating]],
        ['Запах',                            ['select', { label: 'Запах (наличие резких запахов)' }, rating]],
        ['Запаркованность',                  ['select', { label: 'Запаркованность, хаотичная парковка мешающая проходу / визуальному восприятию объектов' }, rating]],
        ['Ливневка',                         ['select', { label: 'Проблемы с ливневой канализацией (лужи, не возможность пройти во время / после дождя)' }, rating]],
        ['Безбарьерная среда',               ['select', { label: 'Безбарьерная среда' }, rating]],
        ['Моральное состояние',              ['select', { label: 'Моральное состояние' }, rating]],
        ['Дух места',                        ['select', { label: 'Дух места - особый формат или облик горно-алтайска' }, rating]],
        ['Общее ощущение',                   ['select', { label: 'Общее ощущение' }, rating]],
    ])
})

command("AddTec", async ctx => {
    return AddFeature('Технический анализ', SOURCE_ID_TEC, [
        ['Состояние фасадов',            ['select', { label: 'Общее состояние фасадов' }, rating]],
        ['Состояние элементов фасадов',  ['select', { label: 'Общее состояние элементов фасадов' }, rating]],
        ['Состояние территории',         ['select', { label: 'Общее состояние территории' }, rating]],
        ['Покрытие',                     ['select', { label: 'Покрытие (ямы, волны, разрушения, сколы, следы ремонта)' }, rating]],
        ['Оборудование',                 ['select', { label: 'Оборудование (состояние элементов)' }, rating]],
        ['Ограждения',                   ['select', { label: 'Ограждения (перекошенность, ржавчина, вмятины, сколы, оголенность закладных)' }, rating]],
        ['Освещение',                    ['select', { label: 'Освещение (перекошенность, ржавчина, вмятины, сколы, оголенность закладных)' }, rating]],
        ['Озеленение',                   ['select', { label: 'Озеленение (открытый грунт, болезни деревьев)' }, rating]],
        ['Отвод воды',                   ['select', { label: 'Отвод воды (наличие работающей ливневой канализации)' }, rating]],
        ['Актуальность функционала',     ['select', { label: 'Актуальность представленного функционала' }, rating]],
        ['Моральное состояние',          ['select', { label: 'Моральное состояние' }, rating]],
        ['Общее ощущение',               ['select', { label: 'Общее ощущение' }, rating]],
        ['Микроклиматический комфорт',   ['select', { label: 'Микроклиматический комфорт пребывания на территории (жарко, душно, влажно, холодно, ветренно, свежо, ощущается холоднее или ощущается теплее)' }, rating]],
        ['Сост клим. элементов',         ['select', { label: 'Состояние элементов городской среды работающей с климатическими особенностями (навесы, защита от ветра, защита от пыли, защита от сели?)' }, rating]],  
    ])
})

async function AddFeature(title, sourceId, input) {
    const mobile = await requestState('layout.mobile')
    const info = mobile
        ? 'Добавте точку на карте'
        : 'Добавте точку на карте'
    const info2 = mobile
        ? 'Наведите перекрестие и нажмите ОК'
        : 'Кликните по карте'
    const coord = await requestPoint(info2, info)
    
    const form = await requestInput(input, {
        title,
        submit: 'Добавить',
        cancel: 'Отмена',
    })

    const date = new Date()
    const properties = {
        ...form,
        dateAdded: date.toString(),
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
        sourceId,
    })
}

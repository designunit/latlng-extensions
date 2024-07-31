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
    const layerId = event.data.layerId
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
    const data = Object
        .keys(feature.properties)
        .filter(key => /^viz[\d]+$/.test(key) || /^tec[\d]+$/.test(key)) // take only vizXX or tecXX
        .map(key => ({
            key,
            value: feature.properties[key] ?? "<unset>",
        }))
    await showMapPopup(feature.geometry.coordinates, ['kv', { data }])
})

command("AddViz", async ctx => {
    return AddFeature('Визуально-Эстетический', SOURCE_ID_VIZ, [
        ['viz1', ['select', { label: 'Контекст, окружение (насколько территория, здания вокруг, ландшафт соответствуют друг другу, являются единым целым)' }, rating]],
        ['viz2', ['select', { label: 'Колористика фасадов, объектов окружающих территорию (хаотичность, отсутствие единого образа, единого цветовой палитры)' }, rating]],
        ['viz3', ['select', { label: 'Состояние фасадов и фасадных элементов окружающих территорию (балконы, оконные и дверные заполнения, пристройки)' }, rating]],
        ['viz4', ['select', { label: 'Территория, насколько объекты внутри территории соответствуют друг-другу, не диссонируют' }, rating]],
        ['viz5', ['select', { label: 'Освещение, достаточность освещенности (равномерность освещения всех зон)' }, rating]],
        ['viz6', ['select', { label: 'Освещение, разнофункциональность (наличие разноуровневого, разнофункционального, декоративного освещения)' }, rating]],
        ['viz7', ['select', { label: 'Озеленение, достаточность (равномерность расперделения озеленения по всей территории, непрерывный зеленый каркас)' }, rating]],
        ['viz8', ['select', { label: 'Озеленение, разнообразие (разноуровневое, разных типов, перемешивание типов зеленых насаждений)' }, rating]],
        ['viz9', ['select', { label: 'Визуальный мусор (реклама, вывески, инженерные коммуникации)' }, rating]],
        ['viz10', ['select', { label: 'Признаки вандализма (тэги / стикеры / графити / сломанные элементы)' }, rating]],
        ['viz11', ['select', { label: 'Навигация, наличие, понятность, интуитивность' }, rating]],
        ['viz12', ['select', { label: 'Чистота (наличие физического мусора, переполненные урны, отсутствие урн)' }, rating]],
        ['viz13', ['select', { label: 'Шум (наличие аудиосопровождения, аудиорекламы, постоянно играющей музыки и тд)' }, rating]],
        ['viz14', ['select', { label: 'Запах (наличие резких запахов)' }, rating]],
        ['viz15', ['select', { label: 'Запаркованность, хаотичная парковка мешающая проходу / визуальному восприятию объектов' }, rating]],
        ['viz16', ['select', { label: 'Проблемы с ливневой канализацией (лужи, не возможность пройти во время / после дождя)' }, rating]],
        ['viz17', ['select', { label: 'Безбарьерная среда' }, rating]],
        ['viz18', ['select', { label: 'Моральное состояние' }, rating]],
        ['viz19', ['select', { label: 'Дух места - особый формат или облик горно-алтайска' }, rating]],
        ['viz20', ['select', { label: 'Общее ощущение' }, rating]],
    ])
})

command("AddTec", async ctx => {
    return AddFeature('Технический анализ', SOURCE_ID_TEC, [
        ['tec1', ['select', { label: 'Общее состояние фасадов' }, rating]],
        ['tec2', ['select', { label: 'Общее состояние элементов фасадов' }, rating]],
        ['tec3', ['select', { label: 'Общее состояние территории' }, rating]],
        ['tec4', ['select', { label: 'Покрытие (ямы, волны, разрушения, сколы, следы ремонта)' }, rating]],
        ['tec5', ['select', { label: 'Оборудование (состояние элементов)' }, rating]],
        ['tec6', ['select', { label: 'Ограждения (перекошенность, ржавчина, вмятины, сколы, оголенность закладных)' }, rating]],
        ['tec7', ['select', { label: 'Освещение (перекошенность, ржавчина, вмятины, сколы, оголенность закладных)' }, rating]],
        ['tec8', ['select', { label: 'Озеленение (открытый грунт, болезни деревьев)' }, rating]],
        ['tec9', ['select', { label: 'Отвод воды (наличие работающей ливневой канализации)' }, rating]],
        ['tec10', ['select', { label: 'Актуальность представленного функционала' }, rating]],
        ['tec11', ['select', { label: 'Моральное состояние' }, rating]],
        ['tec12', ['select', { label: 'Общее ощущение' }, rating]],
        // Дополнительный критерий №1
        // Дополнительный критерий №2
        // Дополнительный критерий №3
        ['tec15', ['select', { label: 'Микроклиматический комфорт пребывания на территории (жарко, душно, влажно, холодно, ветренно, свежо, ощущается холоднее или ощущается теплее)' }, rating]],
        ['tec16', ['select', { label: 'Состояние элементов городской среды работающей с климатическими особенностями (навесы, защита от ветра, защита от пыли, защита от сели?)' }, rating]],  
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

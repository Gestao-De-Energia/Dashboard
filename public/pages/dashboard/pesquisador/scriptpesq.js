/*==================== RODANDO SIMULAÇÃO ====================*/

document.querySelector(".run_btn").addEventListener("click", async function () {
  let metricas = document.querySelectorAll(".metrica-texto .valor");
  let gifs = document.querySelectorAll(".loadingGif");
  let runButton = document.querySelector(".run_btn");
  let runButtonText = document.querySelector(".run_btn_text");

  let texts = ["Rodando simulação.", "Rodando simulação..", "Rodando simulação..."];
  let textIndex = 0;
  let interval;

  try {
      // Indicando que estou rodando o script: desabilito o botão
      runButton.disabled = true;
      runButton.style.opacity = "0.5";
      runButton.style.cursor = "not-allowed";

      // Animação no texto do botão
      interval = setInterval(() => {
          runButtonText.innerHTML = texts[textIndex];
          textIndex = (textIndex + 1) % texts.length;
      }, 500); // Alterna a cada 500ms
      
      // Esconder os valores e exibir os GIFs de carregamento
      metricas.forEach((el) => el.style.display = "none");
      gifs.forEach((gif) => gif.style.display = "inline");

      let response = await fetch("https://dashboard-5lrl.onrender.com/run_simulation", { method: "POST" });

      let data = await response.json();

      metricas[0].innerText = (data.renewable_factor * 100).toFixed(2).replace(".", ",") + "%";
      metricas[1].innerText = (data.loss_load_probability * 100).toFixed(2).replace(".", ",") + "%";
      metricas[2].innerText = "R$" + data.price_electricity.toFixed(3).replace(".", ",");
      metricas[3].innerText = data.houses;
      metricas[4].innerText = data.num_wind_turbines;

      // Salvar localmente para evitar reset
      localStorage.setItem("simulationData", JSON.stringify(data));

  } catch (error) {
      console.error("Erro ao rodar a simulação:", error);
      metricas.forEach((el) => el.innerText = "Erro");
  } finally {
      runButton.disabled = false;
      runButton.style.opacity = "1";
      runButton.style.cursor = "pointer";

      gifs.forEach((gif) => gif.style.display = "none");
      metricas.forEach((el) => el.style.display = "inline");
  }
});

// Recuperar valores ao recarregar a página
window.addEventListener("load", () => {
  if(!localStorage) return;
  
  let savedData = JSON.parse(localStorage.getItem("simulationData"));
  let metricas = document.querySelectorAll(".metrica-texto .valor");
  if (savedData) {
      metricas[0].innerText = (savedData.renewable_factor * 100).toFixed(2).replace(".", ",") + "%";
      metricas[1].innerText = (savedData.loss_load_probability * 100).toFixed(2).replace(".", ",") + "%";
      metricas[2].innerText = "R$" + savedData.price_electricity.toFixed(3).replace(".", ",");
      metricas[3].innerText = savedData.houses;
      metricas[4].innerText = savedData.num_wind_turbines;
  }
});



/*==================== COMENTÁRIO POR DATA ====================*/

// adicionar um comentário para um ponto específico
function addAnnotationToChart(xDate, comment, chart, options) {
  const time = new Date(xDate).getTime();

  // encontrar o índice do timestamp mais próximo no array de categorias
  const closestIndex = options.xaxis.categories.reduce((prevIndex, currTimestamp, index) => {
    return Math.abs(currTimestamp - time) < Math.abs(options.xaxis.categories[prevIndex] - time) ? index : prevIndex;
  }, 0);

  // adicionar anotação no ponto exato do gráfico correspondente
  chart.addPointAnnotation({
    x: options.xaxis.categories[closestIndex],  // timestamp exato do gráfico
    y: options.series[0].data[closestIndex],  // valor correspondente no eixo Y
    label: {
      text: comment,
      style: {
        background: '#ff4560',
        color: '#fff'
      }
    },
    marker: {
      size: 6,
      fillColor: '#ff4560'
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  function setupCommentSection(buttonId, commentSectionId, commentInputId, chart, options) {
    var selectedDate = null;

    // Inicializar flatpickr no botão específico
    flatpickr(buttonId, {
      minDate: "2004-02-01", // Data mínima
      maxDate: "2005-02-03", // Data máxima
      position: "above", // Exibir calendário sobre o botão
      disable: [
        function (date) {
          return !(date.getDate() % 31); // Desabilitar dias 31
        }
      ],
      onChange: function (selectedDates) {
        selectedDate = selectedDates[0]; // Armazenar a data selecionada
        document.querySelector(commentSectionId).style.display = 'flex'; // Mostrar a caixa de comentário
      }
    });

    // Adicionar o evento de teclado para adicionar a anotação
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && selectedDate) {
        // Pegar o que está na caixa de texto
        var comment = document.querySelector(commentInputId).value;

        // Adicionar anotação ao gráfico
        addAnnotationToChart(selectedDate, comment, chart, options);

        // Esconder a caixa de comentário e limpar o texto
        document.querySelector(commentSectionId).style.display = 'none';
        document.querySelector(commentInputId).value = '';
      }
    });
  }

  const commentSections = [
    {
      selectId: '#select_date_fotovoltaica',
      commentSectionId: '#comment_section_fotovoltaica',
      commentInputId: '#comment_input_fotovoltaica',
      chart: chartFotovoltaica,
      options: optionsFotovoltaica
    },
    {
      selectId: '#select_date_eolica',
      commentSectionId: '#comment_section_eolica',
      commentInputId: '#comment_input_eolica',
      chart: chartEolica,
      options: optionsEolica
    },
    {
      selectId: '#select_date_energiaxdemanda',
      commentSectionId: '#comment_section_energiaxdemanda',
      commentInputId: '#comment_input_energiaxdemanda',
      chart: chartEnergiaXDemanda,
      options: optionsEnergiaXDemanda
    },
    {
      selectId: '#select_date_desempenho',
      commentSectionId: '#comment_section_desempenho',
      commentInputId: '#comment_input_desempenho',
      chart: chartDesempenho,
      options: optionsDesempenho
    },
    {
      selectId: '#select_date_energiaxcompensacao',
      commentSectionId: '#comment_section_energiaxcompensacao',
      commentInputId: '#comment_input_energiaxcompensacao',
      chart: chartEnergiaXCompensacao,
      options: optionsEnergiaXCompensacao
    },
    {
      selectId: '#select_date_bateria',
      commentSectionId: '#comment_section_bateria',
      commentInputId: '#comment_input_bateria',
      chart: chartBateria,
      options: optionsBateria
    },
    {
      selectId: '#select_date_stsolar',
      commentSectionId: '#comment_section_stsolar',
      commentInputId: '#comment_input_stsolar',
      chart: chartSTSolar,
      options: optionsSTSolar
    },
    {
      selectId: '#select_date_stvento',
      commentSectionId: '#comment_section_stvento',
      commentInputId: '#comment_input_stvento',
      chart: chartSTVento,
      options: optionsSTVento
    }
  ];

  commentSections.forEach(({ selectId, commentSectionId, commentInputId, chart, options }) => {
    setupCommentSection(selectId, commentSectionId, commentInputId, chart, options);
  });

});

/*==================== COMENTÁRIO GERAL ====================*/
document.addEventListener("DOMContentLoaded", function () {
  function setupGeneralComment(section) {

    const gcWindow = document.getElementById(`gc_window_${section}`);
    const textarea = document.getElementById(`gc_input_${section}`);
    const openButton = document.getElementById(`open_gc_${section}`);
    const editButton = document.getElementById(`edit_gc_${section}`);
    const deleteButton = document.getElementById(`delete_gc_${section}`);
    const saveButton = document.getElementById(`save_gc_${section}`);
    let savedComment = "";

    // ajustar a altura da janela com base na altura do textarea
    function adjustWindowHeight() {
      const newHeight = textarea.offsetHeight + 20; // Adiciona padding extra
      gcWindow.style.height = `${newHeight}px`;
    }

    // colocar o foco no textarea e mover o cursor para o final
    function focusTextarea() {
      textarea.focus();
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
    }

    // mostrar/esconder janela
    openButton.addEventListener("click", function () {
      if (gcWindow.style.display === "none" || gcWindow.style.display === "") {
        gcWindow.style.display = "flex";
      } else {
        gcWindow.style.display = "none";
      }
    });

    // Evento no botão de alterar: foco no textarea
    editButton.addEventListener("click", function () {
      focusTextarea();
    });

    // Evento no botão de deletar: alerta de confirmação e deletar o texto
    deleteButton.addEventListener("click", function () {
      if (savedComment) {
        const confirmDelete = confirm("Tem certeza que deseja deletar o texto?");
        if (confirmDelete) {
          textarea.value = "";
          savedComment = "";
          adjustWindowHeight(); // Ajusta a altura da janela após deletar
        }
      }
    });

    // Evento no botão de salvar: remove o foco do textarea
    saveButton.addEventListener("click", function () {
      savedComment = textarea.value;
      textarea.blur(); // Remove o foco da caixa de texto
      alert("Texto salvo com sucesso!");
    });

    // Ajustar a altura da janela dinamicamente ao digitar ou redimensionar
    textarea.addEventListener("input", adjustWindowHeight);
    textarea.addEventListener("mouseup", adjustWindowHeight);

  }

  const sections = [
    { section: "fotovoltaica" },
    { section: "eolica" },
    { section: "energiaxdemanda" },
    { section: "desempenho" },
    { section: "energiaxcompensacao" },
    { section: "bateria" },
    { section: "stsolar" },
    { section: "stvento" }
  ]

  sections.forEach(({ section }) => {
    setupGeneralComment(section);
  });

});

/*==================== LINK ACTIVE ====================*/
const linkColor = document.querySelectorAll('.nav__link')

function colorLink() {
  linkColor.forEach(l => l.classList.remove('active'))
  this.classList.add('active')
}

linkColor.forEach(l => l.addEventListener('click', colorLink))

/*==================== Gráficos ====================*/
// Gráfico Energia Fotovoltaica
let optionsFotovoltaica;

fetch('../../../dados/dados.json')
  .then(response => response.json())
  .then(data => {
    optionsFotovoltaica = {
      series: [{
        name: "Energia Fotovoltaica",
        color: '#2638DA',
        data: data.energiaF
      }],
      chart: {
        height: 350,
        type: 'line',
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'straight'
      },
      title: {
        text: 'Produção de Energia Fotovoltaica',
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          color: '#263238'
        },
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        },
      },
      xaxis: {
        title: {
          text: "Dia"
        },
        type: 'datetime',
        min: new Date('01 Feb 2004').getTime(),
        categories: data.data
      },
      yaxis: {
        title: {
          text: 'Energia(Kw)'
        },
        decimalsInFloat: 3,
      },
    };

    // Criar e renderizar o gráfico
    var chartFotovoltaica = new ApexCharts(document.querySelector("#chartFotovoltaica"), optionsFotovoltaica);
    chartFotovoltaica.render();

    var resetCssClasses = function (activeEl) {
      var els = document.querySelectorAll('button')

      Array.prototype.forEach.call(els, function (el) {
        el.classList.remove('active')
      })

      activeEl.target.classList.add('active')
    }

    const periodsFotovoltaica = [
      { id: '#fev1', start: '01 Feb 2004', end: '29 Feb 2004' },
      { id: '#fev51', start: '01 Feb 2005', end: '03 Feb 2005' },
      { id: '#jan1', start: '01 Jan 2005', end: '30 Jan 2005' },
      { id: '#mar1', start: '01 Mar 2004', end: '31 Mar 2004' },
      { id: '#abr1', start: '01 Apr 2004', end: '30 Apr 2004' },
      { id: '#mai1', start: '01 May 2004', end: '30 May 2004' },
      { id: '#jun1', start: '01 Jun 2004', end: '30 Jun 2004' },
      { id: '#jul1', start: '01 Jul 2004', end: '30 Jul 2004' },
      { id: '#ago1', start: '01 Aug 2004', end: '30 Aug 2004' },
      { id: '#set1', start: '01 Sept 2004', end: '30 Sept 2004' },
      { id: '#out1', start: '01 Oct 2004', end: '30 Oct 2004' },
      { id: '#nov1', start: '01 Nov 2004', end: '30 Nov 2004' },
      { id: '#dez1', start: '01 Dec 2004', end: '30 Dec 2004' },
      { id: '#sem1', start: '01 Feb 2004', end: '30 Jul 2004' },
      { id: '#sem2', start: '01 Aug 2004', end: '03 Feb 2005' },
      { id: '#one_year1', start: '01 Feb 2004', end: '03 Feb 2005' },
    ];

    //funcionalidade de mudar o gráfico de acordo com o botão clicado
    periodsFotovoltaica.forEach(period => {
      document.querySelector(period.id).addEventListener('click', function (e) {
        resetCssClasses(e);
        chartFotovoltaica.zoomX(new Date(period.start).getTime(), new Date(period.end).getTime());
      });
    });
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
  });

// Definindo as opções para o gráfico de Energia eólica
let optionsEolica;

fetch('../../../dados/dados.json')
  .then(response => response.json())
  .then(data => {
    optionsEolica = {
      series: [{
        name: "Energia Eólica",
        color: '#19AA16',
        data: data.energiaV
      }],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          autoScaleXasis: true
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'straight'
      },
      title: {
        text: 'Produção de Energia Eólica',
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          color: '#263238'
        },
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        },
      },
      xaxis: {
        title: {
          text: "Dia"
        },
        type: 'datetime',
        min: new Date('01 Feb 2004').getTime(),
        categories: data.data
      },
      yaxis: {
        title: {
          text: 'Energia(Kw)'
        },
        decimalsInFloat: 3,
      },
    };


    // Grafico de Energia Fotovoltaica (rendering)
    var chartEolica = new ApexCharts(document.querySelector("#chartEolica"), optionsEolica);
    chartEolica.render();

    //Botões

    const periodsEolica = [
      { id: '#fev', start: '01 Feb 2004', end: '29 Feb 2004' },
      { id: '#fev5', start: '01 Feb 2005', end: '03 Feb 2005' },
      { id: '#jan', start: '01 Jan 2005', end: '30 Jan 2005' },
      { id: '#mar', start: '01 Mar 2004', end: '31 Mar 2004' },
      { id: '#abr', start: '01 Apr 2004', end: '30 Apr 2004' },
      { id: '#mai', start: '01 May 2004', end: '30 May 2004' },
      { id: '#jun', start: '01 Jun 2004', end: '30 Jun 2004' },
      { id: '#jul', start: '01 Jul 2004', end: '30 Jul 2004' },
      { id: '#ago', start: '01 Aug 2004', end: '30 Aug 2004' },
      { id: '#set', start: '01 Sept 2004', end: '30 Sept 2004' },
      { id: '#out', start: '01 Oct 2004', end: '30 Oct 2004' },
      { id: '#nov', start: '01 Nov 2004', end: '30 Nov 2004' },
      { id: '#dez', start: '01 Dec 2004', end: '30 Dec 2004' },
      { id: '#sem_1', start: '01 Feb 2004', end: '30 Jul 2004' },
      { id: '#sem_2', start: '01 Aug 2004', end: '03 Feb 2005' },
      { id: '#one_year', start: '01 Feb 2004', end: '03 Feb 2005' },
    ];

    //funcionalidade de mudar o gráfico de acordo com o botão clicado
    periodsEolica.forEach(period => {
      document.querySelector(period.id).addEventListener('click', function (e) {
        resetCssClasses(e);
        chartEolica.zoomX(new Date(period.start).getTime(), new Date(period.end).getTime());
      });
    });
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
  });


// Gráfico energia x demanda
let optionsEnergiaXDemanda;

fetch('../../../dados/dados.json')
  .then(response => response.json())
  .then(data => {
    optionsEnergiaXDemanda = {
      series: [
        {
          name: "Energia produzida",
          type: "line",
          color: '#A155B9',
          data: data.energiaP
        },
        {
          name: "Demanda Enegética",
          type: "line",
          color: '#E0CE2A',
          data: data.demanda
        }
      ],
      chart: {
        height: 350,
        type: "line",
        stacked: false
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 2
      },
      title: {
        text: 'Produção de energia x Demanda energética',
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          color: '#263238'
        },
      },
      xaxis: {
        title: {
          text: "Dia"
        },
        type: 'datetime',
        min: new Date('01 Feb 2004').getTime(),
        categories: data.data
      },
      yaxis: {
        title: {
          text: "Energia (Kw)"
        },
        decimalsInFloat: 3,
        labels: {
          style: {
            colors: ["#E0CE2A", "#A155B9"] // Cores das séries
          }
        },
      },
      legend: {
        horizontalAlign: "left",
        offsetX: 40
      },
      title: {
        text: 'Produção de Energia x Demanda Energética',
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          color: '#263238'
        },
      }
    };

    // gráfico de produção energética x demanda de energia (rendering)
    var chartEnergiaXDemanda = new ApexCharts(document.querySelector("#chartEnergiaXDemanda"), optionsEnergiaXDemanda);
    chartEnergiaXDemanda.render();
    // Criando funções para selecionar os meses para os botões

    const periodsEnergiaXDemanda = [
      { id: '#fevd', start: '01 Feb 2004', end: '29 Feb 2004' },
      { id: '#fev5d', start: '01 Feb 2005', end: '03 Feb 2005' },
      { id: '#jand', start: '01 Jan 2005', end: '30 Jan 2005' },
      { id: '#mard', start: '01 Mar 2004', end: '31 Mar 2004' },
      { id: '#abrd', start: '01 Apr 2004', end: '30 Apr 2004' },
      { id: '#maid', start: '01 May 2004', end: '30 May 2004' },
      { id: '#jund', start: '01 Jun 2004', end: '30 Jun 2004' },
      { id: '#juld', start: '01 Jul 2004', end: '30 Jul 2004' },
      { id: '#agod', start: '01 Aug 2004', end: '30 Aug 2004' },
      { id: '#setd', start: '01 Sept 2004', end: '30 Sept 2004' },
      { id: '#outd', start: '01 Oct 2004', end: '30 Oct 2004' },
      { id: '#novd', start: '01 Nov 2004', end: '30 Nov 2004' },
      { id: '#dezd', start: '01 Dec 2004', end: '30 Dec 2004' },
      { id: '#sem_1d', start: '01 Feb 2004', end: '30 Jul 2004' },
      { id: '#sem_2d', start: '01 Aug 2004', end: '03 Feb 2005' },
      { id: '#one_yeard', start: '01 Feb 2004', end: '03 Feb 2005' },
    ];

    //funcionalidade de mudar o gráfico de acordo com o botão clicado
    periodsEnergiaXDemanda.forEach(period => {
      document.querySelector(period.id).addEventListener('click', function (e) {
        resetCssClasses(e);
        chartEnergiaXDemanda.zoomX(new Date(period.start).getTime(), new Date(period.end).getTime());
      });
    });
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
  });

//gráfico  desempenho
// Gráfico energia x demanda
let optionsDesempenho;

fetch('../../../dados/dados.json')
  .then(response => response.json())
  .then(data => {
    optionsDesempenho = {
      series: [
        {
          name: 'Energia Fotovoltaica',
          type: 'column',
          data: data.energiaF
        },
        {
          name: 'Net metering',
          type: 'area',
          data: data.netMetering
        },
        {
          name: 'Carga',
          type: 'line',
          data: data.carga
        },
        {
          name: 'Grid público',
          type: 'area',
          color: '#A7B7F3',
          data: data.grid
        }, {
          name: 'Energia Eólica',
          type: 'area',
          color: '#EC9340',
          data: data.energiaV

        },
        {
          name: 'Energia da bateria',
          type: 'line',
          color: '#FF0101',
          data: data.bateria
        }
      ],
      chart: {
        height: 350,
        type: 'line',
        stacked: false,
      },
      stroke: {
        width: [0, 2, 3, 2, 3, 3],
        dashArray: [0, 0, 0, 0, 0, 5],
        curve: 'smooth'
      },
      plotOptions: {
        bar: {
          columnWidth: '50%'
        }
      },
      fill: {
        opacity: [0.85, 0.25, 1],
        gradient: {
          inverseColors: false,
          shade: 'light',
          type: "vertical",
          opacityFrom: 0.85,
          opacityTo: 0.55,
          stops: [0, 100, 100, 100]
        }
      },
      markers: {
        size: 0
      },
      xaxis: {
        title: {
          text: 'Dia',
        },
        type: 'datetime',
        categories: data.data
      },
      yaxis: {
        title: {
          text: 'Energia(Kw)',
        },
        decimalsInFloat: 3,
      },
      legend: {
        horizontalAlign: "left",
        offsetX: 40
      },
      title: {
        text: 'Desempenho',
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          color: '#263238'
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return y.toFixed(0) + ' Kw';
            }
            return y;
          }
        }
      }
    };
    //gráfico  desempenho (rendering)
    var chartDesempenho = new ApexCharts(document.querySelector("#chartDesempenho"), optionsDesempenho);
    chartDesempenho.render();

    const periodsDesempenho = [
      { id: '#fevde', start: '01 Feb 2004', end: '29 Feb 2004' },
      { id: '#fev5de', start: '01 Feb 2005', end: '03 Feb 2005' },
      { id: '#jande', start: '01 Jan 2005', end: '30 Jan 2005' },
      { id: '#marde', start: '01 Mar 2004', end: '31 Mar 2004' },
      { id: '#abrde', start: '01 Apr 2004', end: '30 Apr 2004' },
      { id: '#maide', start: '01 May 2004', end: '30 May 2004' },
      { id: '#junde', start: '01 Jun 2004', end: '30 Jun 2004' },
      { id: '#julde', start: '01 Jul 2004', end: '30 Jul 2004' },
      { id: '#agode', start: '01 Aug 2004', end: '30 Aug 2004' },
      { id: '#setde', start: '01 Sept 2004', end: '30 Sept 2004' },
      { id: '#outde', start: '01 Oct 2004', end: '30 Oct 2004' },
      { id: '#novde', start: '01 Nov 2004', end: '30 Nov 2004' },
      { id: '#dezde', start: '01 Dec 2004', end: '30 Dec 2004' },
      { id: '#sem1de', start: '01 Feb 2004', end: '30 Jul 2004' },
      { id: '#sem2de', start: '01 Aug 2004', end: '03 Feb 2005' },
      { id: '#one_yearde', start: '01 Feb 2004', end: '03 Feb 2005' },
    ];

    //funcionalidade de mudar o gráfico de acordo com o botão clicado
    periodsDesempenho.forEach(period => {
      document.querySelector(period.id).addEventListener('click', function (e) {
        resetCssClasses(e);
        chartDesempenho.zoomX(new Date(period.start).getTime(), new Date(period.end).getTime());
      });
    });
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
  });

//gráfico produção de energia x compensação
let optionsEnergiaXCompensacao;

fetch('../../../dados/dados.json')
  .then(response => response.json())
  .then(data => {
    optionsEnergiaXCompensacao = {
      series: [
        {
          name: "Energia produzida",
          type: "line",
          color: '#A155B9',
          data: data.energiaP
        },
        {
          name: "Net metering",
          type: "line",
          color: '#36ADE8',
          data: data.netMetering
        },
      ],
      chart: {
        height: 350,
        type: "line",
        stacked: false
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 2,
        dashArray: [5, 0]
      },
      xaxis: {
        title: {
          text: "Dia"
        },
        type: 'datetime',
        min: new Date('01 Feb 2004').getTime(),
        categories: data.data
      },
      yaxis: [
        {
          title: {
            text: "Energia(Kw)"
          },
          decimalsInFloat: 3,
        }
      ],
      legend: {
        horizontalAlign: "left",
        offsetX: 40
      },
      title: {
        text: 'Produção de Energia x Compensação',
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          color: '#263238'
        },
      }

    };

    // gráfico produção de energia x compensação (rendering)
    var chartEnergiaXCompensacao = new ApexCharts(document.querySelector("#chartEnergiaXCompensacao"), optionsEnergiaXCompensacao);
    chartEnergiaXCompensacao.render();

    const periodsEnergiaXCompensacao = [
      { id: '#fevda', start: '01 Feb 2004', end: '29 Feb 2004' },
      { id: '#fev5da', start: '01 Feb 2005', end: '03 Feb 2005' },
      { id: '#janda', start: '01 Jan 2005', end: '30 Jan 2005' },
      { id: '#marda', start: '01 Mar 2004', end: '31 Mar 2004' },
      { id: '#abrda', start: '01 Apr 2004', end: '30 Apr 2004' },
      { id: '#maida', start: '01 May 2004', end: '30 May 2004' },
      { id: '#junda', start: '01 Jun 2004', end: '30 Jun 2004' },
      { id: '#julda', start: '01 Jul 2004', end: '30 Jul 2004' },
      { id: '#agoda', start: '01 Aug 2004', end: '30 Aug 2004' },
      { id: '#setda', start: '01 Sept 2004', end: '30 Sept 2004' },
      { id: '#outda', start: '01 Oct 2004', end: '30 Oct 2004' },
      { id: '#novda', start: '01 Nov 2004', end: '30 Nov 2004' },
      { id: '#dezda', start: '01 Dec 2004', end: '30 Dec 2004' },
      { id: '#sem1da', start: '01 Feb 2004', end: '30 Jul 2004' },
      { id: '#sem2da', start: '01 Aug 2004', end: '03 Feb 2005' },
      { id: '#one_yearda', start: '01 Feb 2004', end: '03 Feb 2005' },
    ];

    //funcionalidade de mudar o gráfico de acordo com o botão clicado
    periodsEnergiaXCompensacao.forEach(period => {
      document.querySelector(period.id).addEventListener('click', function (e) {
        resetCssClasses(e);
        chartEnergiaXCompensacao.zoomX(new Date(period.start).getTime(), new Date(period.end).getTime());
      });
    });
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
  });


//grafico da carga e descarga da bateria
let optionsBateria;

fetch('../../../dados/dados.json')
  .then(response => response.json())
  .then(data => {
    optionsBateria = {
      series: [{
        name: 'Carga',
        data: data.carga
      },
      {
        name: 'Descarga',
        data: data.descarga
      }
      ],
      chart: {
        type: 'bar',
        height: 440,
        stacked: true
      },
      colors: ['#165BAA', '#A155B9'],
      plotOptions: {
        bar: {
          borderRadius: 5,
          borderRadiusApplication: 'end', // 'around', 'end'
          borderRadiusWhenStacked: 'all', // 'all', 'last'
          horizontal: false,
          barHeight: '80%',
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 1,
        colors: ["#fff"]
      },
      grid: {
        xaxis: {
          lines: {
            show: false
          }
        }
      },
      yaxis: {
        stepSize: 10,
        decimalsInFloat: 3,
      },
      tooltip: {
        shared: false,
        x: {
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: function (val) {
            return Math.abs(val)
          }
        }
      },
      title: {
        text: 'Quantidade de carga e descargas nas baterias',
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          color: '#263238'
        },
      },
      xaxis: {
        title: {
          text: "tempo"
        },
        type: 'datetime',
        min: new Date('01 Feb 2004').getTime(),
        categories: data.data,
        title: {
          text: 'Dia'
        },
        labels: {
          format: 'MMM \'yy'
        }
      },
    };

    // Criando gráfico de carga e descarga da bateria
    var chartBateria = new ApexCharts(document.querySelector("#chartBateria"), optionsBateria);
    chartBateria.render();

    const periodsBateria = [
      { id: '#fevb', start: '01 Feb 2004', end: '29 Feb 2004' },
      { id: '#fev5b', start: '01 Feb 2005', end: '03 Feb 2005' },
      { id: '#janb', start: '01 Jan 2005', end: '30 Jan 2005' },
      { id: '#marb', start: '01 Mar 2004', end: '31 Mar 2004' },
      { id: '#abrb', start: '01 Apr 2004', end: '30 Apr 2004' },
      { id: '#maib', start: '01 May 2004', end: '30 May 2004' },
      { id: '#junb', start: '01 Jun 2004', end: '30 Jun 2004' },
      { id: '#julb', start: '01 Jul 2004', end: '30 Jul 2004' },
      { id: '#agob', start: '01 Aug 2004', end: '30 Aug 2004' },
      { id: '#setb', start: '01 Sept 2004', end: '30 Sept 2004' },
      { id: '#outb', start: '01 Oct 2004', end: '30 Oct 2004' },
      { id: '#novb', start: '01 Nov 2004', end: '30 Nov 2004' },
      { id: '#dezb', start: '01 Dec 2004', end: '30 Dec 2004' },
      { id: '#semb1', start: '01 Feb 2004', end: '30 Jul 2004' },
      { id: '#semb2', start: '01 Aug 2004', end: '03 Feb 2005' },
      { id: '#one_yearb', start: '01 Feb 2004', end: '03 Feb 2005' },
    ];

    //funcionalidade de mudar o gráfico de acordo com o botão clicado
    periodsBateria.forEach(period => {
      document.querySelector(period.id).addEventListener('click', function (e) {
        resetCssClasses(e);
        chartBateria.zoomX(new Date(period.start).getTime(), new Date(period.end).getTime());
      });
    });
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
  });


// Definindo os valores do gráfico de irradiação solar
let optionsSTSolar;

fetch('../../../dados/dados.json')
  .then(response => response.json())
  .then(data => {
    optionsSTSolar = {
      title: {
        text: "Irradiação Solar Anual",
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          color: '#263238'
        },
      },
      series: [{
        name: "Irradiação solar (Wh/m^2)",
        data: data.irradiacao

      }],
      chart: {
        id: 'area-datetime',
        type: 'area',
        height: 350,
        zoom: {
          autoScaleYaxis: true
        }
      },
      annotations: {
        yaxis: [{
          y: 30,
          borderColor: '#999',
          label: {
            show: true,
            text: 'Support',
            style: {
              color: "#fff",
              background: '#00E396'
            }
          },
        }],
      },
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 0,
        style: 'hollow',
      },
      xaxis: {
        title: {
          text: "Dia"
        },
        type: 'datetime',
        min: new Date('01 Feb 2004').getTime(),
        categories: data.data
      },
      yaxis: {
        title: {
          text: 'Irradiação solar (Wh/m^2)'
        },
        decimalsInFloat: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          stops: [0, 100]
        }
      },
    };

    // Gráfico da série temporal solar (rendering)
    var chartSTSolar = new ApexCharts(document.querySelector("#chartSTSolar"), optionsSTSolar);
    chartSTSolar.render();

    const periodsSTSolar = [
      { id: '#fevv', start: '01 Feb 2004', end: '29 Feb 2004' },
      { id: '#fev5v', start: '01 Feb 2005', end: '03 Feb 2005' },
      { id: '#janv', start: '01 Jan 2005', end: '30 Jan 2005' },
      { id: '#marv', start: '01 Mar 2004', end: '31 Mar 2004' },
      { id: '#abrv', start: '01 Apr 2004', end: '30 Apr 2004' },
      { id: '#maiv', start: '01 May 2004', end: '30 May 2004' },
      { id: '#junv', start: '01 Jun 2004', end: '30 Jun 2004' },
      { id: '#julv', start: '01 Jul 2004', end: '30 Jul 2004' },
      { id: '#agov', start: '01 Aug 2004', end: '30 Aug 2004' },
      { id: '#setv', start: '01 Sept 2004', end: '30 Sept 2004' },
      { id: '#outv', start: '01 Oct 2004', end: '30 Oct 2004' },
      { id: '#novv', start: '01 Nov 2004', end: '30 Nov 2004' },
      { id: '#dezv', start: '01 Dec 2004', end: '30 Dec 2004' },
      { id: '#semv1', start: '01 Feb 2004', end: '30 Jul 2004' },
      { id: '#semv2', start: '01 Aug 2004', end: '03 Feb 2005' },
      { id: '#one_yearv', start: '01 Feb 2004', end: '03 Feb 2005' },
    ];

    //funcionalidade de mudar o gráfico de acordo com o botão clicado
    periodsSTSolar.forEach(period => {
      document.querySelector(period.id).addEventListener('click', function (e) {
        resetCssClasses(e);
        chartSTSolar.zoomX(new Date(period.start).getTime(), new Date(period.end).getTime());
      });
    });
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
  });


// Criação de opções e estilização para o gráfico de série temporal do vento  
let optionsSTVento;

fetch('../../../dados/dados.json')
  .then(response => response.json())
  .then(data => {
    optionsSTVento = {
      title: {
        text: "Vento Anual",
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          fontFamily: 'Arial',
          color: '#263238'
        },
      },

      series: [{
        name: "Velocidade do vento",
        color: '#EC9340',
        data: data.vento
      }],

      chart: {
        id: 'area-datetime',
        type: 'area',
        height: 350,
        zoom: {
          autoScaleYaxis: true
        }
      },
      annotations: {
        yaxis: [{
          y: 30,
          borderColor: '#999',
          label: {
            show: true,
            text: 'Support',
            style: {
              color: "#fff",
              background: '#00E396'
            }
          }
        }],
      },
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 0,
        style: 'hollow',
      },
      xaxis: {
        title: {
          text: "Dia"
        },
        type: 'datetime',
        min: new Date('01 Feb 2004').getTime(),
        categories: data.data
      },
      yaxis: {
        title: {
          text: 'Velocidade do vento (m/s)'
        },
        decimalsInFloat: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          stops: [0, 100]
        }
      },
    };

    // Gráfico da série temporal do vento
    var chartSTVento = new ApexCharts(document.querySelector("#chartSTVento"), optionsSTVento);
    chartSTVento.render();
    // Criando funções para selecionar os meses para os botões

    const periodsSTVento = [
      { id: '#fevs', start: '01 Feb 2004', end: '29 Feb 2004' },
      { id: '#fev5s', start: '01 Feb 2005', end: '03 Feb 2005' },
      { id: '#jans', start: '01 Jan 2005', end: '30 Jan 2005' },
      { id: '#mars', start: '01 Mar 2004', end: '31 Mar 2004' },
      { id: '#abrs', start: '01 Apr 2004', end: '30 Apr 2004' },
      { id: '#mais', start: '01 May 2004', end: '30 May 2004' },
      { id: '#juns', start: '01 Jun 2004', end: '30 Jun 2004' },
      { id: '#juls', start: '01 Jul 2004', end: '30 Jul 2004' },
      { id: '#agos', start: '01 Aug 2004', end: '30 Aug 2004' },
      { id: '#sets', start: '01 Sept 2004', end: '30 Sept 2004' },
      { id: '#outs', start: '01 Oct 2004', end: '30 Oct 2004' },
      { id: '#novs', start: '01 Nov 2004', end: '30 Nov 2004' },
      { id: '#dezs', start: '01 Dec 2004', end: '30 Dec 2004' },
      { id: '#sems1', start: '01 Feb 2004', end: '30 Jul 2004' },
      { id: '#sems2', start: '01 Aug 2004', end: '03 Feb 2005' },
      { id: '#one_years', start: '01 Feb 2004', end: '03 Feb 2005' },
    ];

    //funcionalidade de mudar o gráfico de acordo com o botão clicado
    periodsSTVento.forEach(period => {
      document.querySelector(period.id).addEventListener('click', function (e) {
        resetCssClasses(e);
        chartSTVento.zoomX(new Date(period.start).getTime(), new Date(period.end).getTime());
      });
    });
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
  });

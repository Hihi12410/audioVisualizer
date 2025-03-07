//https://codepen.io/nfj525/pen/rVBaab

window.onload = function() 
{
    const audioPlayer = document.getElementById("audio");
    const file = document.getElementById("fileupload");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const power = document.getElementById("power");

    file.onchange = function() {
        var files = this.files;
        
        audioPlayer.src = URL.createObjectURL(files[0]);
        audioPlayer.load();

        var context = new AudioContext();
        var source = context.createMediaElementSource(audioPlayer);
        var analyser = context.createAnalyser();

        source.connect(analyser);
        analyser.connect(context.destination);

        analyser.fftSize = 256;

        var buffLen = analyser.frequencyBinCount;
        var dataArr = new Uint8Array(buffLen);

        var W;
        var H;
        var centerX;
        var centerY;
        var radius;

        var drumThreshold;

        const kickRange = { min: 20, max: 100 };
        const snareRange = { min: 150, max: 250 };
        const hiHatRange = { min: 1000, max: 1200 };

        function resizeCanvas() {
            const scale = window.devicePixelRatio;  // Get device pixel ratio
                const width = window.innerWidth;
                const height = window.innerHeight;

                canvas.width = width * scale;  // Scale canvas width
                canvas.height = height * scale; // Scale canvas height
                ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas

                W = canvas.width;
                H = canvas.height;

                centerX = W / 2;
                centerY = H / 2;

                radius = Math.min(centerX, centerY) * 0.6;
        } window.onresize = resizeCanvas; resizeCanvas();

        power.oninput = function() 
        {
            drumThreshold = power.value;
        }; drumThreshold = power.value
       
        function detectDrums() {
            let kickPower = 0;
            let snarePower = 0;
            let hiHatPower = 0;

            for (let i = 0; i < buffLen; i++) {
                let frequency = i * (context.sampleRate / analyser.fftSize);
                let amplitude = dataArr[i];

                if (frequency >= kickRange.min && frequency <= kickRange.max) {
                    kickPower += amplitude;
                }
                if (frequency >= snareRange.min && frequency <= snareRange.max) {
                    snarePower += amplitude;
                }
                if (frequency >= hiHatRange.min && frequency <= hiHatRange.max) {
                    hiHatPower += amplitude;
                }
            }

            let normal = Math.max(kickPower, snarePower, hiHatPower) + 0.1;
            return { kick: kickPower/(100/drumThreshold)/normal, snare:snarePower/(100/drumThreshold)/normal, hihat:hiHatPower/(100/drumThreshold)/normal};
        }

        function renderFrame() 
        {
            requestAnimationFrame(renderFrame);
            
            let drumval = detectDrums();
            
            ctx.fillStyle = `rgba(${drumval.kick * 50}, ${drumval.snare * 50}, ${drumval.hihat * 50}, 1)`;
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = "source-atop";
            ctx.lineCap = "round";
            ctx.shadowBlur = 1;
            ctx.shadowColor = "rgba(10, 10, 10, 0.5)";
            
            analyser.getByteFrequencyData(dataArr);
            for (let i = 0; i < buffLen; i++) {

                let angle = (i / buffLen) * (2 * Math.PI);
                let bH = (dataArr[i] / 255) * radius;
                let x1 = centerX + Math.cos(angle) * radius;
                let y1 = centerY + Math.sin(angle) * radius;
                let x2 = centerX + Math.cos(angle) * (radius + bH);
                let y2 = centerY + Math.sin(angle) * (radius + bH);

                ctx.strokeStyle = `hsl(${(i / buffLen) * 360}, 100%, 70%)`;
                ctx.lineWidth = Math.max(2, bH / 15);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        audioPlayer.play();
        renderFrame();
    }
};
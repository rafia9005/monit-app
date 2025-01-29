const express = require('express');
const os = require('os');
const osUtils = require('os-utils');
const si = require('systeminformation');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    const updateStats = async () => {
        try {
            osUtils.cpuUsage(async (cpuUsage) => {
                const freeMemory = os.freemem();
                const totalMemory = os.totalmem();
                const uptime = os.uptime();
                const loadavg = os.loadavg();
                const cpuData = await si.cpu();
                const osData = await si.osInfo();
                const diskData = await si.diskLayout();
                const networkData = await si.networkStats();
                const processes = await si.processes();
                const userData = await si.users();

                const processData = processes.list.map(proc => ({
                    pid: proc.pid,
                    name: proc.name,
                    memoryUsage: (proc.mem / 1024 / 1024).toFixed(2),
                    cpuUsage: proc.cpu.toFixed(2)
                }));

                socket.emit('systemData', {
                    cpuUsage: (cpuUsage * 100).toFixed(2),
                    freeMemory: (freeMemory / 1024 / 1024).toFixed(2),
                    totalMemory: (totalMemory / 1024 / 1024).toFixed(2),
                    uptime: (uptime / 60).toFixed(2),
                    loadavg: loadavg.join(' | '),
                    cpuData: cpuData,
                    osData: osData,
                    diskData: diskData,
                    networkData: networkData,
                    processData: processData,
                    userData: userData
                });
            });
        } catch (error) {
            console.error('Error fetching system data:', error);
        }
    };

    setInterval(updateStats, 1000);

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(4040, () => {
    console.log('Monitoring app is running at http://localhost:3000');
});


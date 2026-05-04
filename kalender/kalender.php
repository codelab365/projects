<?php
// 1. JSON-Datei einlesen
$json_file = 'events.json';
$events = [];

if (file_exists($json_file)) {
    $json_data = file_get_contents($json_file);
    $events = json_decode($json_data, true);
}

// 2. Filter- und Sortierlogik
$heute = date('Y-m-d');
$aktuelle_events = [];

if (is_array($events)) {
    foreach ($events as $event) {
        // Nur Events berücksichtigen, die heute oder in der Zukunft liegen
        if ($event['datum'] >= $heute) {
            $aktuelle_events[] = $event;
        }
    }

    // Nach Datum und Uhrzeit aufsteigend sortieren
    usort($aktuelle_events, function ($a, $b) {
        if ($a['datum'] === $b['datum']) {
            return strcmp($a['uhrzeit'], $b['uhrzeit']);
        }
        return strcmp($a['datum'], $b['datum']);
    });
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brettspiel-Kalender</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            background-color: #f9f9f9;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: #fff;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            color: #333;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        tr:hover {
            background-color: #f1f1f1;
        }
        .no-events {
            text-align: center;
            padding: 20px;
            color: #666;
        }
    </style>
</head>
<body>

    <h1>Kommende Brettspiel-Events</h1>

    <table>
        <thead>
            <tr>
                <th>Datum</th>
                <th>Uhrzeit</th>
                <th>Event</th>
                <th>Ort</th>
                <th>Beschreibung</th>
            </tr>
        </thead>
        <tbody>
            <?php
            if (!empty($aktuelle_events)) {
                foreach ($aktuelle_events as $event) {
                    $formatiertes_datum = date("d.m.Y", strtotime($event["datum"]));
                    $formatierte_uhrzeit = date("H:i", strtotime($event["uhrzeit"]));
                    
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($formatiertes_datum) . "</td>";
                    echo "<td>" . htmlspecialchars($formatierte_uhrzeit) . " Uhr</td>";
                    echo "<td>" . htmlspecialchars($event["titel"]) . "</td>";
                    echo "<td>" . htmlspecialchars($event["ort"]) . "</td>";
                    echo "<td>" . htmlspecialchars($event["beschreibung"]) . "</td>";
                    echo "</tr>";
                }
            } else {
                echo "<tr><td colspan='5' class='no-events'>Keine kommenden Events geplant.</td></tr>";
            }
            ?>
        </tbody>
    </table>

</body>
</html>

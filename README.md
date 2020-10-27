ls | ForEach-Object { move -Path $_ -Destination "$($_.name).jpg"; $i = $i + 1 }

ffmpeg -start_number 0 -i "%d.png.jpg" out.mp4
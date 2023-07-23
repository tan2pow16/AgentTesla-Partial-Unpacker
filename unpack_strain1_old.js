'use strict';

/*
 * Copyright (c) 2023, tan2pow16. All rights reserved.
 *
 * For samples with alpha channel enabled and have no junk data.
 *  I haven't seen this kind of samples for a while.
 */

const fs = require('fs');
const path = require('path');

const pngjs = require('pngjs');

function decode(_fpath, key)
{
  let fp = path.parse(path.resolve(_fpath));

  let auto_key = !key;
  let hex_key = key || '';

  // Extract data from PNG
  let raw_data = fs.readFileSync(`${fp.dir}/${fp.base}`);
  let img = pngjs.PNG.sync.read(raw_data);
  let buf_in = img.data;
  let buf_out = Buffer.allocUnsafe(buf_in.length);
  let ptr_in = 0;
  let ptr_out = 0;
  let cache = 0;
  let swap = [2, 1, 0, 3];
  for(let i = 0 ; i < img.height ; i++)
  {
    for(let j = 0 ; j < img.width ; j++)
    {
      ptr_in = (j * img.height + i) << 2;
      for(let k = 0 ; k < 4 ; k++)
      {
        cache = ptr_out + swap[k];
        buf_out[cache] = buf_in[ptr_in + k];
      }
      ptr_out += 4;
    }
  }
  
  let length = (buf_out[0] | (buf_out[1] << 8) | (buf_out[2] << 16) | (buf_out[3] << 24)) - 1;
  let ext = 'bin';
  
  if(length > 0)
  {
    buf_out = buf_out.slice(4, 4 + length);
    if(hex_key.length > 0)
    {
      ext = 'dll';
      let key = Buffer.from(hex_key, 'hex');
      for(let i = 0 ; i < buf_out.length ; i++)
      {
        buf_out[i] ^= key[i % key.length];
      }
    }
    else if(auto_key)
    {
      let key = Buffer.allocUnsafe(3);
  
      key[0] = buf_out[0] ^ 0x4D;
      key[1] = buf_out[1] ^ 0x5A;
      key[2] = buf_out[2] ^ 0x90;
  
      if(buf_out[3] === key[0])
      {
        ext = 'dll';
        for(let i = 0 ; i < buf_out.length ; i++)
        {
          buf_out[i] ^= key[i % key.length];
        }
      }
      else
      {
        console.warn('Auto key detection failed. Output raw binary instead.');
      }
    }
  }
  
  fs.writeFileSync(`${fp.dir}/${fp.name}.${ext}`, buf_out);
}

function __main__(args)
{
  process.on('uncaughtException', function(err) {
    console.error(err);
  });

  if(args.length < 1)
  {
    console.log('node %s <path/to/encoded.png> [hex-key]', path.basename(__filename));
    process.exitCode = 1;
    return;
  }
  decode(args[0], args[1]);
}

if(require.main === module)
{
  __main__(process.argv.slice(2));
}

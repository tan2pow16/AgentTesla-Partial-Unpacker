'use strict';

/*
 * Copyright (c) 2023, tan2pow16. All rights reserved.
 *
 * For samples with no alpha channel in the encoded part.
 */

const fs = require('fs');
const path = require('path');

const pngjs = require('pngjs');

function decode(_fpath, key_str)
{
  let fp = path.parse(path.resolve(_fpath));

  let img = pngjs.PNG.sync.read(fs.readFileSync(`${fp.dir}/${fp.base}`));

  let ptr_out = 0;
  let buf_out = Buffer.allocUnsafe((img.data.length >> 2) * 3);
  for(let i = 0 ; i < img.height ; i++)
  {
    for(let j = 0 ; j < img.width ; j++)
    {
      let ptr_in = (j * img.height + i) << 2;
      if(img.data[ptr_in + 3])
      {
        for(let k = 0 ; k < 3 ; k++)
        {
          buf_out[ptr_out + k] = img.data[ptr_in + k];
        }
        ptr_out += 3;
      }
    }
  }

  let len = ptr_out - 1;
  let key = Buffer.from(key_str, 'utf8');
  for(let i = 0 ; i < key.length ; i++)
  {
    key[i] ^= 112 ^ buf_out[len];
  }

  for(let i = 0 ; i < len ; i++)
  {
    buf_out[i] ^= key[i % key.length];
  }
  
  fs.writeFileSync(`${fp.dir}/${fp.name}.bin`, buf_out.slice(0, len));
}

function __main__(args)
{
  process.on('uncaughtException', function(err) {
    console.error(err);
  });

  if(args.length !== 2)
  {
    console.log('node %s <path/to/encoded.png> <key>', path.basename(__filename));
    process.exitCode = 1;
    return;
  }
  decode(args[0], args[1]);
}

if(require.main === module)
{
  __main__(process.argv.slice(2));
}
